from pydantic import BaseModel, Field, HttpUrl, EmailStr, AnyUrl
from typing import Optional, List
from app.services.db import DbModel
from datetime import datetime


class UserCreateDto(BaseModel):
    username: str
    email: EmailStr
    name: str

class UsersImportRequestDto(BaseModel):
    users: List[UserCreateDto]
    verified: bool = False
    requirePasswordChange: bool = False
    joinDefaultChannels: bool = True
    sendEmail: bool = False


class ImportedUserResultDto(BaseModel):
    request: UserCreateDto
    created_id: Optional[str] = None
    error: Optional[str] = None
    password: str
    email_sent: bool = False
    email_error: Optional[str] = None


class ShortUserDto(BaseModel):
    id: str = Field(alias='_id')
    username: str


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


class ShortTeamDto(BaseModel):
    id: str = Field(alias='_id')
    name: str
    roomId: str
    type: int


class RoleDto(BaseModel):
    id: str = Field(alias='_id')
    scope: str
    description: str
    mandatory2fa: bool
    name: str
    protected: bool


class RoomDto(BaseModel):
    id: str = Field(alias='_id')
    description: Optional[str] = None
    broadcast: Optional[bool] = None
    name: Optional[str] = None
    t: str = None
    msgs: Optional[int] = None
    usersCount: Optional[int] = None
    u: Optional[ShortUserDto] = None
    ro: Optional[bool] = None
    default: Optional[bool] = None
    topic: Optional[str] = None
    announcement: Optional[str] = None


class UserInfoRoomDto(BaseModel):
    id: str = Field(alias='_id')
    name: str
    rid: str
    t: str
    roles: Optional[List[str]] = None


class RoomUserDto(BaseModel):
    id: str = Field(alias='_id')
    username: str
    name: str
    status: str


class RoomInfoDto(BaseModel):
    team: Optional[ShortTeamDto] = None
    members: List[RoomUserDto] = None


class CreateSpaceRequest(BaseModel):
    url: HttpUrl
    user_id: str
    token: str
    name: str


class SpaceModel(DbModel):
    url: HttpUrl
    user_id: str
    token: str
    name: str


class SpaceDto(SpaceModel):
    pass


class TeamDto(BaseModel):
    id: str = Field(alias='_id')
    name: Optional[str] = None
    type: Optional[int] = None
    createdAt: Optional[str] = None
    createdBy: Optional[ShortUserDto] = None
    updatedAt: Optional[str] = None
    roomId: Optional[str] = None


class TeamInfoDto(BaseModel):
    users: List[RoomUserDto]
    rooms: List[RoomDto]


class UserInfoDto(BaseModel):
    teams: List[ShortTeamDto]
    rooms: List[UserInfoRoomDto]


class SmtpSettingsDto(BaseModel):
    host: AnyUrl
    sender: EmailStr


class SmtpSettingsModel(DbModel):
    host: AnyUrl
    sender: EmailStr


class SmtpSettingsResponseDto(BaseModel):
    value: Optional[SmtpSettingsDto]


class UsersToChangePasswordDto(BaseModel):
    users: List[str]
    sendEmail: bool


class Result[T](BaseModel):
    value: Optional[T] = None
    error: Optional[str] = None


class ChangedPasswordDto(BaseModel):
    user: str
    password: Optional[str] = None
    password_error: Optional[str] = None
    email_sent: bool = False
    email_send_error: Optional[str] = None
