import asyncio

from fastapi import APIRouter, Depends, HTTPException, FastAPI
from app.models import UserDto, TeamDto, UserInfoDto
from typing import Optional, List
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

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
