from typing import List

from fastapi import APIRouter, Depends

from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

from app.models import RoleDto

router = APIRouter()


@router.get("/")
async def get_roles(space=Depends(get_space)) -> List[RoleDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    roles = [
        RoleDto.model_validate(role)
        for role
        in (await rocket_request(rocket.roles_list, **rocket_query_args(count=0)))['roles']
    ]

    return roles
