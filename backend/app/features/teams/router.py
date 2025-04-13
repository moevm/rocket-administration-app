import asyncio

from fastapi import APIRouter, Depends
from typing import List

from app.lib.cache import key_for_space
from app.models import RoomDto, TeamInfoDto
from app.features.spaces.utils import get_space
from app.models import TeamDto
from app.models import RoomUserDto
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args

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
