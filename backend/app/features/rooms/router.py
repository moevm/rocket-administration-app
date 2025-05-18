import asyncio

from fastapi import APIRouter, Depends
from typing import Optional, List

from app.lib.cache import key_for_space
from app.models import RoomDto, RoomInfoDto
from app.features.spaces.utils import get_space
from app.models import TeamDto
from app.models import UserDto
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.utils import batch_execute, generate_password, extract_exception_message
from app.config import settings

from app.models import RoomsImportRequestDto, ImportedRoomResultDto, RoomCreateDto

router = APIRouter()


@router.get("/")
async def get_rooms(space=Depends(get_space)) -> List[RoomDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    rooms = [
        RoomDto.model_validate(room)
        for room
        in (await rocket_request(
            rocket.rooms_admin_rooms,
            **rocket_query_args(types=['discussions', 'teams', 'c', 'p'], count=0)
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

@router.post("/groups/")
async def create_groups(
        body: RoomsImportRequestDto,
        space=Depends(get_space)
) -> List[ImportedRoomResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_group_creation(group_data: RoomCreateDto):
        result = ImportedRoomResultDto(
            request=group_data
        )

        try:
            create_args = group_data.model_dump(exclude_unset=True)

            response_data = await rocket_request(
                rocket.groups_create,
                **rocket_query_args(**create_args)
            )

            created_group = response_data['group']
            result.created_id = created_group['_id']

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_args = [(group,) for group in body.rooms]
    results: List[ImportedRoomResultDto] = await batch_execute(
        _process_group_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results

@router.post("/channels/")
async def create_channel(
        body: RoomsImportRequestDto,
        space=Depends(get_space)
) -> List[ImportedRoomResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_channel_creation(channel_data: RoomCreateDto):
        result = ImportedRoomResultDto(
            request=channel_data
        )

        try:
            create_args = channel_data.model_dump(exclude_unset=True)

            response_data = await rocket_request(
                rocket.channels_create,
                **rocket_query_args(**create_args)
            )

            created_channel = response_data['channel']
            result.created_id = created_channel['_id']

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_args = [(channel,) for channel in body.rooms]
    results: List[ImportedRoomResultDto] = await batch_execute(
        _process_channel_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results