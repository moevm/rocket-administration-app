import asyncio

from fastapi import APIRouter, Depends

from app.lib.cache import key_for_space
from app.models import UserDto, TeamDto, UserInfoDto, UsersToChangePasswordDto, ChangedPasswordDto
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

    return UserInfoDto.model_validate({
        'teams': teams_info_raw['teams'],
        'rooms': user_info_raw['user']['rooms']
    })


@router.post("/change-passwords")
async def change_user_passwords(body: UsersToChangePasswordDto, space=Depends(get_space), db=Depends(get_db)) -> List[ChangedPasswordDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    if body.sendEmail:
        smtp_settings = await require_smtp_settings(db, space.id);

    async def _process(user: str, password: str): 
        result = ChangedPasswordDto(user=user)        
        try:  
            await rocket_request(rocket.users_update, **rocket_query_args(user_id=user, password=password))
        except Exception as e:
            result.password_error = extract_exception_message(e)
        else:
            result.password = password

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
                f"Ваш новый пароль в пространстве {space.url}: {password}"
            )
        except Exception as e:
            result.email_send_error = extract_exception_message(e)
        else:
            result.email_sent = True
        return result

    results = await batch_execute(
        _process, 
        [(user, generate_password(16)) for user in body.users], 
        settings.app.batch_delay
    )

    return results

