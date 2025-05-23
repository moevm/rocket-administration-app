import json
from typing import List
import uuid
from fastapi import APIRouter, Depends

from app.models import UsersAndRoomsDto, UsersAndRoomResDto, UsersAndTeamsDto, UsersAndTeamResDto

from app.features.spaces.utils import get_space
from app.services.db import get_db
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.cache import key_for_space
from app.lib.utils import batch_execute, extract_exception_message
from app.config import settings

router = APIRouter()

@router.post("/")
async def add_users_to_rooms(body: UsersAndRoomsDto, space=Depends(get_space)) -> List[UsersAndRoomResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    
    async def _process(users: List[str], room: str) -> UsersAndRoomResDto:
        result = UsersAndRoomResDto(success=False, user_list=users, room=room)
        ddp_call = {
            "msg": "method",
            "method": "addUsersToRoom",
            "id": str(uuid.uuid4()),
            "params": [{"rid": room, "users": users}]
        }
        tmp = await rocket_request(
            rocket.call_api_post,
            "method.call/addUsersToRoom",
            **rocket_query_args(
            message=json.dumps(ddp_call)
            )
        )
        if json.loads(tmp.get('message')).get('error'):
            result.error = json.loads(tmp.get('message')).get('error').get('reason')
        else:
            result.success = True
        return result
    
    return await batch_execute(
            _process,
            [(body.users, room) for room in body.rooms],
            settings.app.batch_delay
    )

@router.delete("/group")
async def remove_users_from_room(body: UsersAndRoomsDto, space=Depends(get_space)) -> List[UsersAndRoomResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(user: str, room: str) -> UsersAndRoomResDto:
        result = UsersAndRoomResDto(success=False, user_list=[user], room=room)
        try:
            tmp = await rocket_request(
                rocket.groups_kick, **rocket_query_args(room_id=room, user_id=user)
            )
        except Exception as e:
            print(e)
            result.error = extract_exception_message(e)
        else:
            result.success = True
        return result
    
    return await batch_execute(
            _process,
            [(user, room) for room in body.rooms for user in body.users],
            settings.app.batch_delay
    )

@router.delete("/team")
async def remove_users_from_team(body: UsersAndTeamsDto, space=Depends(get_space)) -> List[UsersAndTeamResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(user: str, team: str) -> UsersAndTeamResDto:
        result = UsersAndTeamResDto(success=False, user_list=[user], team=team)
        try:
            rooms = []
            if body.ban_in_rooms:
                rooms_list = await rocket_request(
                    rocket.teams_list_rooms, **rocket_query_args(team_id=team)
                )
                rooms = [ i["_id"] for i in rooms_list["rooms"]]
            tmp = await rocket_request(
                rocket.teams_remove_member, **rocket_query_args(team_id=team, user_id=user, rooms=rooms)
            )
        except Exception as e:
            result.error = extract_exception_message(e)
        else:
            result.success = True
        return result
    
    return await batch_execute(
            _process,
            [(user, team) for team in body.teams for user in body.users],
            settings.app.batch_delay
    )