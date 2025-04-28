import json
from typing import List
import uuid
from fastapi import APIRouter, Depends

from app.models import UsersAndRoomsDto, UsersAndRoomsResDto

from app.features.spaces.utils import get_space
from app.services.db import get_db
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.cache import key_for_space
from app.lib.utils import batch_execute, extract_exception_message
from app.config import settings

router = APIRouter()

@router.post("/add")
async def add_users_to_channel(body: UsersAndRoomsDto, space=Depends(get_space)) -> List[UsersAndRoomsResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    
    async def _process(users: List[str], room: str) -> UsersAndRoomsResDto:
        ddp_call = {
            "msg": "method",
            "method": "addUsersToRoom",
            "id": str(uuid.uuid4()),
            "params": [{"rid": room, "users": users}]
        }
        result = await rocket_request(
            rocket.call_api_post,
            "method.call/addUsersToRoom",
            **rocket_query_args(
            message=json.dumps(ddp_call)
            )
        )
        if json.loads(result.get('message')).get('error'):
            error = UsersAndRoomsResDto(success=False, msg=json.loads(result.get('message')).get('error').get('reason'))
            return error
        return UsersAndRoomsResDto()
    
    return await batch_execute(
            _process,
            [(body.users, room) for room in body.rooms],
            settings.app.batch_delay
    )