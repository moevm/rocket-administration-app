from typing import List

from fastapi import APIRouter, Depends

from app.lib.cache import key_for_space
from app.models import CreateSpaceRequest, SpaceDto, SpaceModel
from app.lib.rocket import obtain_rocket_instance
from app.services.db import get_db, convert_to
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args

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

@router.get("/{space_id}/status")
async def get_user_status(space=Depends(get_space)):

    try:
        rocket = await obtain_rocket_instance(key_for_space(space))

        await rocket_request(
            rocket.me,
            **rocket_query_args()
        )
        return {"status": "ok"}

    except Exception as e:
        if "You must be logged in to do this." in str(e):
            return {"status": "unauthorized"}
        else:
            return {"status": "unknown-error"}