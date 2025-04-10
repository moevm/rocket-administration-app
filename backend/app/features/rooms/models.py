from pydantic import BaseModel, Field
from typing import List, Optional

class UserModel(BaseModel):
    id: str = Field(alias='_id')
    username: str

class RoomDto(BaseModel):
    id: str = Field(alias='_id')
    fname: Optional[str] = None
    description: Optional[str] = None
    broadcast: Optional[bool] = None
    federated: Optional[bool] = None
    name: Optional[str] = None
    t: Optional[str] = None
    msgs: Optional[int] = None
    usersCount: Optional[int] = None
    u: Optional[UserModel] = None
    ro: Optional[bool] = None
    default: Optional[bool] = None
    topic: Optional[str] = None
    announcement: Optional[str] = None

class PaginatedRoomResponseDto(BaseModel):
    count: int
    offset: int
    total: int

class RoomResponseDto(PaginatedRoomResponseDto):
    rooms: List[RoomDto]

