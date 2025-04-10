from fastapi import APIRouter, Depends, HTTPException, FastAPI
from .models import UsersResponseDto
from typing import Optional
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

router = APIRouter()


@router.get("/")
async def get_users(
        query: Optional[str] = None,
        offset: Optional[int] = None,
        sort: Optional[str] = None,
        count: Optional[int] = None,
        space=Depends(get_space)
) -> UsersResponseDto:

    rocket = await obtain_rocket_instance(key_for_space(space))
    users = UsersResponseDto.model_validate(await rocket_request(
        rocket.users_list,
        **rocket_query_args(
            query=query,
            offset=offset,
            sort=sort,
            count=count,
        )
    ))
    return users
