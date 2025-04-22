from fastapi import Depends, HTTPException
from starlette import status

from app.features.spaces.models import SpaceModel
from app.services.db import get_db, validate_object_id


async def get_space(space_id: str, db=Depends(get_db)) -> SpaceModel:
    try:
        space_object_id = validate_object_id(space_id)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid space_id')
    space_db_result = await db.spaces.find_one({"_id": space_object_id})
    if space_db_result is None:
        raise HTTPException(status_code=404, detail='Space not found')

    return SpaceModel.model_validate(space_db_result)
