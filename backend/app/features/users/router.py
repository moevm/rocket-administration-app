from fastapi import APIRouter, Depends

from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, key_for_space, rocket_request
from app.services.db import get_db

router = APIRouter()

@router.get("/")
async def get_users(db=Depends(get_db), space=Depends(get_space)):
    rocket = await obtain_rocket_instance(key_for_space(space))
    users = await rocket_request(rocket.users_list)
    return users