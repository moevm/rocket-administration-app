import asyncio

import json
from fastapi import APIRouter, Depends, HTTPException, Path
from typing import List

from app.lib.cache import key_for_space
from app.models import RoomDto, TeamInfoDto
from app.features.spaces.utils import get_space
from app.models import TeamDto
from app.models import RoomUserDto
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.services.db import get_db
from app.lib.utils import batch_execute, generate_password, extract_exception_message
from app.config import settings
from app.models import TeamsImportRequestDto, ImportedTeamResultDto, TeamCreateDto, TeamDeletedDto

router = APIRouter()


@router.get("/")
async def get_teams(space=Depends(get_space)) -> List[TeamDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    teams = [
        TeamDto.model_validate(team)
        for team
        in (await rocket_request(
            rocket.teams_list_all,
            **rocket_query_args(count=0)
        ))['teams']
    ]
    return teams

@router.get("/{team_id}")
async def get_team_information(team_id: str, space=Depends(get_space)) -> TeamInfoDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    (team_rooms_raw, team_users_raw) = await asyncio.gather(
        rocket_request(rocket.teams_list_rooms, **rocket_query_args(team_id=team_id, count=0)),
        rocket_request(rocket.teams_members, **rocket_query_args(team_id=team_id, count=0))
    )

    return TeamInfoDto.model_validate({
        'users': [member['user'] for member in team_users_raw['members']],
        'rooms': team_rooms_raw['rooms']
    })

@router.post("/")
async def create_teams(
    body: TeamsImportRequestDto,
    space=Depends(get_space)
) -> List[ImportedTeamResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_team_creation(team_data: TeamCreateDto):

        result = ImportedTeamResultDto(
            request=team_data
        )

        try:
            create_args = team_data.model_dump(exclude_unset=True)

            responce_data = await rocket_request(
                rocket.teams_create,
                **rocket_query_args(**create_args)
            )

            create_team = responce_data['team']
            result.created_id = create_team['_id']

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_args = [(teams,) for teams in body.teams]
    results: List[ImportedTeamResultDto] = await batch_execute(
        _process_team_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results

@router.delete("/{team_id}/{rooms}")
async def delete_team(
    team_id: str,
    rooms: str = Path(
        ...,
        title="Rooms (JSON list)",
        description='JSON-encoded list of room IDs. Example: ["room1", "room2"]'
    ),
    space=Depends(get_space)
) -> TeamDeletedDto:
    rocket = await obtain_rocket_instance(key_for_space(space))
    print(rooms)
    print(team_id)
    try:
        rooms_to_delete = json.loads(rooms)
        if not isinstance(rooms_to_delete, list):
            raise ValueError("rooms must be a JSON-encoded list")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON for 'rooms'")
    res = TeamDeletedDto(team=team_id, rooms=rooms_to_delete, success=False)
    try:
        await rocket_request(rocket.teams_delete, **rocket_query_args(team_id=team_id, roomsToRemove=rooms_to_delete))
    except Exception as e:
        res.error = extract_exception_message(e)
    else:
        res.success = True
    return res