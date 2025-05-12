import logging
import sys
from contextlib import asynccontextmanager
from typing import Any, Annotated, Union, Optional, TypeVar, Type
from bson import ObjectId
from pydantic import BaseModel, HttpUrl, AfterValidator, PlainSerializer, WithJsonSchema, Field, ConfigDict
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import ConnectionFailure

from app.config import settings

logger = logging.getLogger(__name__)

mongodb_client = AsyncMongoClient(settings.mongo.uri)


@asynccontextmanager
async def database_lifespan(_):
    try:
        logger.info("Connecting to MongoDB")
        await mongodb_client.aconnect()
        await mongodb_client.admin.command('ping')
        logger.info("Connected to MongoDB")
    except ConnectionFailure as e:
        logger.error("Could not connect to MongoDB:", exc_info=e)
        sys.exit(1)

    yield

    await mongodb_client.aclose()


async def get_db() -> AsyncDatabase:
    return mongodb_client[settings.mongo.database]


def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")


PyObjectId = Annotated[
    Union[str, ObjectId],
    AfterValidator(validate_object_id),
    PlainSerializer(lambda x: str(x), return_type=str),
    WithJsonSchema({"type": "string"}, mode="serialization")
]


class DbModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias='_id', default=None)

    model_config = ConfigDict(arbitrary_types_allowed=True)

T = TypeVar('T', bound=BaseModel)
V = TypeVar('V', bound=BaseModel)
def convert_to(target_model_class: Type[T], input_model: V) -> T:
    return target_model_class.model_validate(input_model.model_dump(mode='json', by_alias=True))
