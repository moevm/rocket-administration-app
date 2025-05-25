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
from app.lib.utils import batch_execute, generate_password, extract_exception_message, hide_system_messages
from app.config import settings
from app.models import TeamsImportRequestDto, ImportedTeamResultDto, TeamCreateDto, TeamsDeleteDto, TeamDeletedDto

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
                **rocket_query_args(
                    name=team_data.name,
                    team_type=team_data.team_type
                )
            )

            create_team = responce_data['team']
            result.created_id = create_team['_id']
            if team_data.disable_system_messages:
                await hide_system_messages(rocket, result.created_id)
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

@router.delete("/")
async def remove_teams(body: TeamsDeleteDto, space=Depends(get_space)) -> List[TeamDeletedDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    
    async def _process(team_id: str):
        res = TeamDeletedDto(team=team_id, success=False)
        try:
            rooms = []
            if body.delete_linked_rooms:
                rooms_list = await rocket_request(
                    rocket.teams_list_rooms, **rocket_query_args(team_id=team_id)
                )
                rooms += [ i["_id"] for i in rooms_list["rooms"]]
        except Exception as e:
            res.error = extract_exception_message(e)
            return res

        res.rooms = rooms        
        try:
            if len(rooms):
                await rocket_request(rocket.teams_delete, **rocket_query_args(team_id=team_id, roomsToRemove=rooms))
            else:
                await rocket_request(rocket.teams_delete, **rocket_query_args(team_id=team_id))
        except Exception as e:
            res.error = extract_exception_message(e)
        else:
            res.success = True
        return res
    print(body.teams)
    return await batch_execute(
            _process,
            [(team,) for team in body.teams],
            settings.app.batch_delay
    )