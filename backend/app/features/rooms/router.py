import asyncio

from fastapi import APIRouter, Depends
from typing import Optional, List

from app.models import RoomDto, RoomInfoDto
from app.features.spaces.utils import get_space
from app.models import TeamDto
from app.models import UserDto
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

router = APIRouter()


@router.get("/")
async def get_rooms(space=Depends(get_space)) -> List[RoomDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    rooms = [
        RoomDto.model_validate(room)
        for room
        in (await rocket_request(
            rocket.rooms_admin_rooms,
            **rocket_query_args(types=['discussions', 'teams', 'd', 'c', 'p'], count=0)
        ))['rooms']
    ]
    return rooms


@router.get("/{room_id}")
async def get_room_information(room_id: str, space=Depends(get_space)) -> RoomInfoDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    (room_info_raw, room_members_raw) = await asyncio.gather(
        rocket_request(rocket.rooms_info,**rocket_query_args(room_id=room_id)),
        rocket_request(rocket.call_api_get, method="rooms.membersOrderedByRole", **rocket_query_args(roomId=room_id, count=0))
    )

    return RoomInfoDto.model_validate({
        'team': room_info_raw['team'] if 'team' in room_info_raw else None,
        'members': room_members_raw['members']
    })
