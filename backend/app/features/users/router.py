from fastapi import APIRouter, Depends, HTTPException, FastAPI
from .models import UsersResponseDto
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request

router = APIRouter()

@router.get("/")
async def get_users(space=Depends(get_space)) -> UsersResponseDto:
    rocket = await obtain_rocket_instance(key_for_space(space))
    users = UsersResponseDto.model_validate(await rocket_request(rocket.users_list))
    return users