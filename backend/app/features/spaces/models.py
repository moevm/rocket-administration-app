from pydantic import BaseModel, HttpUrl
from app.services.db import DbModel

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