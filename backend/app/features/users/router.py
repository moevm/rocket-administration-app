import asyncio

from fastapi import APIRouter, Depends
from fastapi import HTTPException

from app.lib.cache import key_for_space
from app.models import UserDto, TeamDto, UserInfoDto, UsersToChangePasswordDto,\
    ChangedPasswordDto, UsersImportRequestDto, ImportedUserResultDto, UserCreateDto, \
    UsersDeleteDto, UserDeleteResDto, UpdateUserRequest
from typing import List
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.utils import batch_execute, generate_password, extract_exception_message
from app.lib.smtp import send_email, require_smtp_settings
from app.services.email_service import EmailService
from app.services.db import get_db
from app.config import settings
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/")
async def get_users(space=Depends(get_space)) -> List[UserDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    users = [
        UserDto.model_validate(user)
        for user
        in (await rocket_request(
            rocket.users_list,
            **rocket_query_args(count=0)
        ))['users']
    ]
    return users



@router.get("/{user_id}")
async def get_user_information(user_id: str, space=Depends(get_space)) -> UserInfoDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    (teams_info_raw, user_info_raw) = await asyncio.gather(
        rocket_request(rocket.call_api_get, method="users.listTeams", **rocket_query_args(userId=user_id)),
        rocket_request(rocket.users_info, **rocket_query_args(user_id=user_id, includeUserRooms='true'))
    )

    room_filter = (await rocket_request(
            rocket.rooms_admin_rooms,
            **rocket_query_args(types=['c', 'p'], count=0)
        ))['rooms']

    return UserInfoDto.model_validate({
        'teams': teams_info_raw['teams'],
        'rooms': [room for room in user_info_raw['user']['rooms']
                  if room["rid"] in set(i['_id'] for i in room_filter)]
    })


@router.post("/change-passwords")
async def change_user_passwords(
    body: UsersToChangePasswordDto, 
    space=Depends(get_space), 
    db=Depends(get_db)
) -> List[ChangedPasswordDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    smtp_settings = None
    email_service = None
    
    if body.sendEmail:
        smtp_settings = await require_smtp_settings(db, space.id)
        email_service = EmailService(db, space.id)

    async def _process(user: str, password_to_set: str):
        result = ChangedPasswordDto(user=user)        
        try:
            await rocket_request(
                rocket.users_update, 
                **rocket_query_args(user_id=user, password=password_to_set)
            )
        except Exception as e:
            logger.error(f"Failed to change password for {user}: {e}")
            result.password_error = extract_exception_message(e)
        else:
            result.password = password_to_set

        if not body.sendEmail:
            return result
        
        try:
            user_info = await rocket_request(
                rocket.users_info, 
                **rocket_query_args(user_id=user)
            )
            
            if not user_info["user"].get('emails') or len(user_info["user"]['emails']) == 0:
                result.email_send_error = "У пользователя нет адресов электронной почты"
                return result
            
            user_email = user_info["user"]['emails'][0]["address"]
            username = user_info["user"].get("username", user)

            message_id = await email_service.send_password_changed_email(
                to_email=user_email,
                username=username,
                password=password_to_set,
                space_url=str(space.url)
            )
            result.email_sent = True
            logger.info(f"Password changed email sent to {user_email}, message_id: {message_id}")
            
        except Exception as e:
            result.email_send_error = extract_exception_message(e)
            logger.error(f"ERROR!! Failed to send password change email: {e}")
            
        return result

    args_for_batch = []
    for user_login in body.users:
        password_for_user = body.password if body.password is not None else generate_password(16)
        args_for_batch.append((user_login, password_for_user))

    results = await batch_execute(
        _process,
        args_for_batch,
        settings.app.batch_delay
    )

    return results


@router.post("/")
async def create_users(
        body: UsersImportRequestDto,
        space=Depends(get_space),
        db=Depends(get_db)
) -> List[ImportedUserResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    email_service = None
    if body.sendEmail:
        try:
            await require_smtp_settings(db, space.id)
            email_service = EmailService(db, space.id)
        except HTTPException as e:
            logger.warning(f"SMTP not configured! Error: {e.detail}")

    async def _process_user_creation(user_data: UserCreateDto):
        if user_data.password and user_data.password.strip():
            password = user_data.password.strip()
        else:
            password = generate_password(16)

        result = ImportedUserResultDto(
            request=user_data,
            password=password
        )

        try:
            create_args = user_data.model_dump(exclude_unset=True)
            create_args.pop('password', None)
            create_args['password'] = password
            create_args['verified'] = body.verified
            create_args['joinDefaultChannels'] = body.joinDefaultChannels

            if body.sendEmail:
                create_args['requirePasswordChange'] = False
            else:
                create_args['requirePasswordChange'] = body.requirePasswordChange

            if user_data.roles:
                create_args['roles'] = user_data.roles

            response_data = await rocket_request(
                rocket.users_create,
                **rocket_query_args(**create_args)
            )

            created_user = response_data['user']
            result.created_id = created_user['_id']

        except Exception as e:
            result.error = extract_exception_message(e)

        if body.sendEmail and result.created_id and not result.error and email_service:
            try:
                logger.info(f"Attempting to send welcome email to {user_data.email}")
                
                message_id = await email_service.send_welcome_email(
                    to_email=user_data.email,
                    username=user_data.username,
                    password=password,
                    space_url=str(space.url)
                )
                result.email_sent = True
            except Exception as e:
                result.email_error = f"Ошибка отправки email: {extract_exception_message(e)}"
        else:
            if not body.sendEmail:
                logger.info(f"Email sending disabled for user {user_data.username}")
            elif not email_service:
                logger.warning(f"Email service not available for user {user_data.username}")
            elif result.error:
                logger.warning(f"User creation failed for {user_data.username}, skipping email")

        return result

    tasks_args = [(user,) for user in body.users]

    results: List[ImportedUserResultDto] = await batch_execute(
        _process_user_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results

@router.delete("/")
async def delete_users(
    body: UsersDeleteDto,
      space=Depends(get_space)
) -> List[UserDeleteResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(user: str):
        res = UserDeleteResDto(user=user, force_delete=body.force_delete)
        try:
            await rocket_request(
                rocket.users_delete,
                **rocket_query_args(user_id=user, confirmRelinquish=body.force_delete)
            )
        except Exception as e:
            res.error = extract_exception_message(e)
        else:
            res.success = True
        return res

    return await batch_execute(
        _process,
        [(user,) for user in body.users],
        settings.app.batch_delay
    )


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UpdateUserRequest,
    space=Depends(get_space)
) -> UserDto:
    """
    Обновляет информацию о пользователе
    """
    rocket = await obtain_rocket_instance(key_for_space(space))

    try:
        user_info = await rocket_request(
            rocket.users_info,
            **rocket_query_args(user_id=user_id)
        )

        if not user_info or 'user' not in user_info:
            raise HTTPException(status_code=404, detail="User is not found")

        update_data = user_data.model_dump(exclude_none=True)

        if update_data:
            response = await rocket_request(
                rocket.call_api_post,
                "users.update",
                **rocket_query_args(
                    userId=user_id,
                    data=update_data
                )
            )

        updated_info = await rocket_request(
            rocket.users_info,
            **rocket_query_args(user_id=user_id)
        )

        return UserDto.model_validate(updated_info['user'])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to update user: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update user: {str(e)}"
        )
