from fastapi import APIRouter, Depends
from typing import Optional
from .models import TeamResponseDto
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

router = APIRouter()

@router.get("/")
async def get_rooms(
        count: Optional[int] = None,
        offset: Optional[int] = None,
        space=Depends(get_space)
) -> TeamResponseDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    rooms = TeamResponseDto.model_validate(await rocket_request(
        rocket.teams_list_all,
        **rocket_query_args(
            count=count,
            offset=offset,
        )
    ))
    return rooms