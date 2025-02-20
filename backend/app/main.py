from typing import Annotated, Any, Union, Optional

import uvicorn
from bson import ObjectId
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, HttpUrl, AfterValidator, PlainSerializer, WithJsonSchema, Field, ConfigDict
from rocketchat_API.APIExceptions.RocketExceptions import RocketConnectionException, RocketAuthenticationException
from rocketchat_API.rocketchat import RocketChat

from app.db import database_lifespan, get_db

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

class CreateSpaceRequest(BaseModel):
    url: HttpUrl
    login: str
    password: str
    name: str

class SpaceModel(DbModel):
    url: HttpUrl
    login: str
    password: str
    name: str

class SpaceDto(SpaceModel):
    pass

app = FastAPI(lifespan=database_lifespan)
counter = 0

@app.get("/")
async def root(db=Depends(get_db)):
    global counter
    await db.testcollection.insert_one({"id": counter, "biba": "boba"})
    counter += 1
    results = []
    async for doc in db.testcollection.find():
        doc.pop("_id")
        results.append(doc)
    return results

@app.post("/spaces")
async def create_space(create_space_request: CreateSpaceRequest, db=Depends(get_db)) -> SpaceDto:
    try:
        # TODO async
        rocket = RocketChat(
            user=create_space_request.login,
            password=create_space_request.password,
            server_url=str(create_space_request.url)
        )

        response = rocket.me()
        if response.status_code == 200 and response.json()['success'] == False:
            raise HTTPException(status_code=400, detail="Ошибка авторизации")
    except RocketAuthenticationException:
        raise HTTPException(status_code=400, detail="Неверные учетные данные")
    except RocketConnectionException:
        raise HTTPException(status_code=400, detail="Недействительный URL или проблема с подключением к серверу")
    except Exception as e:
        # TODO middleware
        if e is not HTTPException:
            raise HTTPException(status_code=500)

    space = SpaceModel.model_validate(create_space_request.model_dump(mode='json'))
    insert_result = await db.spaces.insert_one(space.model_dump(mode='json'))
    space_model = SpaceModel.model_validate(await db.spaces.find_one({"_id": insert_result.inserted_id}))
    return SpaceDto.model_validate(space_model.model_dump(mode='json', by_alias=True))


@app.get("/spaces")
async def get_spaces(db=Depends(get_db)):
    result = []
    async for doc in db.spaces.find():
        space_model = SpaceModel.model_validate(doc)
        result.append(SpaceDto.model_validate(space_model.model_dump(mode='json', by_alias=True)))
    return result


def start():
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
