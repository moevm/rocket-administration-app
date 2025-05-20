from typing import List
from fastapi import APIRouter, Depends

from app.models import TeamsAndRoomsDto, TeamsAndRoomsResDto

from app.features.spaces.utils import get_space
from app.services.db import get_db
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.cache import key_for_space
from app.lib.utils import batch_execute, extract_exception_message
from app.config import settings

router = APIRouter()


@router.post("/")
async def add_rooms_to_team(body: TeamsAndRoomsDto, space=Depends(get_space)) -> List[TeamsAndRoomsResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(room: str, team: str) -> TeamsAndRoomsResDto:
        result = TeamsAndRoomsResDto(success=False, room=room, team=team)

        try:
            await rocket_request(
                rocket.teams_add_rooms,
                **rocket_query_args(team_id=team, rooms=[room]),
            )

            result.success = True

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_to_execute = []
    for team_id in body.teams:
        for room_id in body.rooms:
            tasks_to_execute.append((room_id, team_id))

    return await batch_execute(
        _process,
        tasks_to_execute,
        settings.app.batch_delay
    )

@router.delete("/")
async def remove_rooms_from_team(body: TeamsAndRoomsDto, space=Depends(get_space)) -> List[TeamsAndRoomsResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_remove(room: str, team: str) -> TeamsAndRoomsResDto:
        result = TeamsAndRoomsResDto(success=False, room=room, team=team)

        try:
            await rocket_request(
                rocket.teams_remove_room,
                **rocket_query_args(team_id=team, room_id=room),
            )
            result.success = True
        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_to_execute = []
    for team_id in body.teams:
        for room_id in body.rooms:
            tasks_to_execute.append((room_id, team_id))

    return await batch_execute(
        _process_remove,
        tasks_to_execute,
        settings.app.batch_delay
    )