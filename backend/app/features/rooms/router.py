from fastapi import APIRouter, Depends
from typing import Optional
from .models import RoomResponseDto
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

router = APIRouter()


@router.get("/")
async def get_rooms(
        types: Optional[str] = None,
        filter: Optional[str] = None,
        count: Optional[int] = None,
        sort: Optional[str] = None,
        offset: Optional[int] = None,
        space=Depends(get_space)
) -> RoomResponseDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    rooms = RoomResponseDto.model_validate(await rocket_request(
        rocket.rooms_admin_rooms,
        **rocket_query_args(
            type=types,
            filter=filter,
            count=count,
            sort=sort,
            offset=offset,
        )
    ))
    return rooms