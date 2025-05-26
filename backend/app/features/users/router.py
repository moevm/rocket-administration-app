import asyncio

from fastapi import APIRouter, Depends

from app.lib.cache import key_for_space
from app.models import UserDto, TeamDto, UserInfoDto, UsersToChangePasswordDto,\
    ChangedPasswordDto, UsersImportRequestDto, ImportedUserResultDto, UserCreateDto, \
    UsersDeleteDto, UserDeleteResDto
from typing import Optional, List
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.utils import batch_execute, generate_password, extract_exception_message
from app.lib.smtp import send_email, require_smtp_settings
from app.services.db import get_db
from app.config import settings

router = APIRouter()


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

    print([room for room in user_info_raw['user']['rooms']
                  if room["rid"] in set(i['_id'] for i in room_filter)])
    return UserInfoDto.model_validate({
        'teams': teams_info_raw['teams'],
        'rooms': [room for room in user_info_raw['user']['rooms']
                  if room["rid"] in set(i['_id'] for i in room_filter)]
    })


@router.post("/change-passwords")
async def change_user_passwords(body: UsersToChangePasswordDto, space=Depends(get_space), db=Depends(get_db)) -> List[ChangedPasswordDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    if body.sendEmail:
        smtp_settings = await require_smtp_settings(db, space.id)

    async def _process(user: str, password_to_set: str):
        result = ChangedPasswordDto(user=user)        
        try:
            await rocket_request(rocket.users_update, **rocket_query_args(user_id=user, password=password_to_set))
        except Exception as e:
            print(e)
            result.password_error = extract_exception_message(e)
        else:
            result.password = password_to_set

        if not body.sendEmail:
            return result
        
        try:
            user_info = await rocket_request(rocket.users_info, **rocket_query_args(user_id=user))
            if len(user_info["user"]['emails']) == 0:
                result.email_send_error = "У пользователя нет адресов электронной почты"
                return result
            await send_email(
                smtp_settings,
                user_info["user"]['emails'][0]["address"],
                "Пароль изменен",
                f"Ваш новый пароль в пространстве {space.url}: {password_to_set}"
            )
        except Exception as e:
            result.email_send_error = extract_exception_message(e)
        else:
            result.email_sent = True
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

    if body.sendEmail:
        smtp_settings = await require_smtp_settings(db, space.id)

    async def _process_user_creation(user_data: UserCreateDto):
        generated_password = generate_password(16)

        result = ImportedUserResultDto(
            request=user_data,
            password=generated_password
        )

        try:
            create_args = user_data.model_dump(exclude_unset=True)
            create_args['password'] = generated_password
            create_args['verified'] = body.verified
            create_args['joinDefaultChannels'] = body.joinDefaultChannels

            if body.sendEmail:
                create_args['requirePasswordChange'] = False

            else:
                create_args['requirePasswordChange'] = body.requirePasswordChange

            response_data = await rocket_request(
                rocket.users_create,
                **rocket_query_args(**create_args)
            )

            created_user = response_data['user']
            result.created_id = created_user['_id']

        except Exception as e:
            result.error = extract_exception_message(e)

        if body.sendEmail and result.created_id:
            try:
                await send_email(
                    smtp_settings,
                    user_data.email,
                    f"Ваш аккаунт в {space.url} создан",
                    f"Добро пожаловать!\n\nВаш временный пароль для входа в пространство {space.url}:\n{generated_password}\n\nРекомендуем сменить его после первого входа."
                )
                result.email_sent = True
            except Exception as e:
                result.email_error = f"Ошибка отправки email: {extract_exception_message(e)}"

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