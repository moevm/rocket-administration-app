from typing import List

from fastapi import APIRouter, Depends

from app.models import CreateSpaceRequest, SpaceDto, SpaceModel
from app.lib.rocket import obtain_rocket_instance, RocketInstanceKey, key_for_space
from app.services.db import get_db, convert_to

router = APIRouter()

@router.post("/")
async def create_space(create_space_request: CreateSpaceRequest, db=Depends(get_db)) -> SpaceDto:
    space = convert_to(SpaceModel, create_space_request)
    await obtain_rocket_instance(key_for_space(space))

    insert_result = await db.spaces.insert_one(space.model_dump(mode='json'))
    space_model = SpaceModel.model_validate(await db.spaces.find_one({"_id": insert_result.inserted_id}))
    return convert_to(SpaceDto, space_model)


@router.get("/")
async def get_spaces(db=Depends(get_db)) -> List[SpaceDto]:
    result = []
    async for doc in db.spaces.find():
        result.append(convert_to(SpaceDto, SpaceModel.model_validate(doc)))
    return result