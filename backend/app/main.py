from asyncio import to_thread
from typing import Annotated, Any, Union, Optional, TypeVar, Type

from bson import ObjectId
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, HttpUrl, AfterValidator, PlainSerializer, WithJsonSchema, Field, ConfigDict, EmailStr
from rocketchat_API.APIExceptions.RocketExceptions import RocketConnectionException, RocketAuthenticationException
from rocketchat_API.rocketchat import RocketChat
from aiosmtplib import SMTP

from app.config import settings
from app.db import database_lifespan, get_db
from app.logging import setup_logging


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

T = TypeVar('T', bound=BaseModel)
V = TypeVar('V', bound=BaseModel)
def convert_model(target_model_class: Type[T], input_model: V) -> T:
    return target_model_class.model_validate(input_model.model_dump(mode='json', by_alias=True))

setup_logging()
app = FastAPI(lifespan=database_lifespan)

@app.get("/_health")
async def health():
    return "ok"

class EmailRequest(BaseModel):
    subject: str
    recipient: EmailStr
    body: str

@app.post("/send-email")
async def send_email(email_request: EmailRequest):
    try:
        async with SMTP(hostname=settings.smtp.host, port=settings.smtp.port) as smtp:
            print(settings.smtp.user, settings.smtp.password)
            await smtp.login(settings.smtp.user, settings.smtp.password)

            message = f"Subject: {email_request.subject}\n\n{email_request.body}"
            await smtp.sendmail(settings.smtp.user, email_request.recipient, message)

        return {"detail": "Email sent successfully"}
    except Exception as e:
        print(type(e), e)
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")


@app.post("/spaces")
async def create_space(create_space_request: CreateSpaceRequest, db=Depends(get_db)) -> SpaceDto:
    try:
        # TODO async
        rocket = await to_thread(
            RocketChat,
            user=create_space_request.login,
            password=create_space_request.password,
            server_url=str(create_space_request.url)
        )

        response = await to_thread(rocket.me)
        if not (response.status_code == 200 and response.json()['success'] == True):
            raise HTTPException(status_code=400, detail="Ошибка авторизации")
    except RocketAuthenticationException:
        raise HTTPException(status_code=400, detail="Неверные учетные данные")
    except RocketConnectionException:
        raise HTTPException(status_code=400, detail="Недействительный URL или проблема с подключением к серверу")
    except HTTPException as e:
        raise e
    except Exception as e:
        # TODO middleware
        raise HTTPException(status_code=500)

    space = convert_model(SpaceModel, create_space_request)
    insert_result = await db.spaces.insert_one(space.model_dump(mode='json'))
    space_model = SpaceModel.model_validate(await db.spaces.find_one({"_id": insert_result.inserted_id}))
    return convert_model(SpaceDto, space_model)


@app.get("/spaces")
async def get_spaces(db=Depends(get_db)):
    result = []
    async for doc in db.spaces.find():
        result.append(convert_model(SpaceDto, SpaceModel.model_validate(doc)))
    return result
