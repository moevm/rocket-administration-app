from fastapi import APIRouter, Depends

from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request, rocket_query_args

from .models import RolesResponseDto

router = APIRouter()


@router.get("/")
async def get_roles(space=Depends(get_space)) -> RolesResponseDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    roles = RolesResponseDto.model_validate(
        await rocket_request(rocket.roles_list)
    )

    return roles
