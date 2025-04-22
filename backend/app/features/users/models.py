from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class UserEmailDto(BaseModel):
    address: str
    verified: bool


class UserDto(BaseModel):
    id: str = Field(alias='_id')
    name: str
    username: str
    status: str
    active: bool
    type: str
    roles: List[str]
    avatarETag: Optional[str] = None
    nameInsensitive: str
    emails: Optional[List[UserEmailDto]] = None
    lastLogin: Optional[datetime] = None


class PaginatedResponseDto(BaseModel):
    count: int
    offset: int
    total: int

class UsersResponseDto(PaginatedResponseDto):
    users: List[UserDto]

