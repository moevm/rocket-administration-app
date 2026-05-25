from pydantic import BaseModel, Field, HttpUrl, EmailStr, AnyUrl
from typing import Optional, List, Literal, Dict
from app.services.db import DbModel
from datetime import datetime


class TeamsAndRoomsDto(BaseModel):
    teams: List[str]
    rooms: List[str]


class TeamsAndRoomsResDto(BaseModel):
    success: bool = True
    error: Optional[str] = None
    room: str
    team: str


class ShortUserDto(BaseModel):
    id: str = Field(alias='_id')
    username: str
    name: Optional[str] = None


class RoomDto(BaseModel):
    id: str = Field(alias='_id')
    description: Optional[str] = None
    broadcast: Optional[bool] = None
    name: Optional[str] = None
    t: Optional[str] = None
    msgs: Optional[int] = None
    usersCount: Optional[int] = None
    u: Optional[ShortUserDto] = None
    ro: Optional[bool] = None
    default: Optional[bool] = None
    topic: Optional[str] = None
    announcement: Optional[str] = None
    reactWhenReadOnly: Optional[bool] = None


class TeamDto(BaseModel):
    id: str = Field(alias='_id')
    name: Optional[str] = None
    type: Optional[int] = None
    createdAt: Optional[str] = None
    createdBy: Optional[ShortUserDto] = None
    updatedAt: Optional[str] = None
    roomId: Optional[str] = None


class UserCreateDto(BaseModel):
    username: str
    email: EmailStr
    name: str
    password: Optional[str] = None
    roles: List[str] = []


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


class RoomCreateDto(BaseModel):
    name: str
    readOnly: bool = False
    disable_system_messages: bool = True
    teamId: Optional[str] = None


class UpdateRoomRequest(BaseModel):
    name: Optional[str] = None
    readOnly: Optional[bool] = None
    topic: Optional[str] = None
    announcement: Optional[str] = None
    description: Optional[str] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    active: Optional[bool] = None
    roles: Optional[List[str]] = None


class RoomsImportRequestDto(BaseModel):
    rooms: List[RoomCreateDto]


class ImportedRoomResultDto(BaseModel):
    request: RoomCreateDto
    created_id: Optional[str] = None
    error: Optional[str] = None


class TeamCreateDto(BaseModel):
    name: str
    team_type: int
    disable_system_messages: bool = True


class TeamsImportRequestDto(BaseModel):
    teams: List[TeamCreateDto]


class ImportedTeamResultDto(BaseModel):
    request: TeamCreateDto
    created_id: Optional[str] = None
    error: Optional[str] = None


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
    nameInsensitive: Optional[str] = None
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
    roles: Optional[List[str]] = None


class RoomInfoDto(BaseModel):
    team: Optional[ShortTeamDto] = None
    members: Optional[List[RoomUserDto]] = None
    reactWhenReadOnly: bool = False


class RoomSettingsPatchDto(BaseModel):
    reactWhenReadOnly: bool


class RoomMemberRolesDto(BaseModel):
    roles: List[str]


class RoomMemberRolesResDto(BaseModel):
    success: bool = True
    error: Optional[str] = None


class RoomRoleTypeDto(BaseModel):
    id: str
    label: str


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


class TeamInfoDto(BaseModel):
    users: List[RoomUserDto]
    rooms: List[RoomDto]

class TeamDeletedDto(BaseModel):
    team: str
    rooms: List[str] = []
    success: bool
    error: Optional[str] = None


class UserInfoDto(BaseModel):
    teams: List[ShortTeamDto]
    rooms: List[UserInfoRoomDto]


class SmtpSettingsDto(BaseModel):
    host: AnyUrl
    sender: EmailStr
    use_tls: bool = False


class SmtpSettingsModel(DbModel):
    host: AnyUrl
    sender: EmailStr
    use_tls: bool = False


class SmtpSettingsResponseDto(BaseModel):
    value: Optional[SmtpSettingsDto]


EmailTemplateKey = Literal["welcome_user", "password_changed"]


class EmailTemplateDto(BaseModel):
    key: EmailTemplateKey
    subject: str
    body: str


class EmailTemplatesMapDto(BaseModel):
    welcome_user: EmailTemplateDto
    password_changed: EmailTemplateDto


class EmailTemplateUpsertDto(BaseModel):
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)


class EmailTemplatePreviewRequestDto(BaseModel):
    template: EmailTemplateUpsertDto
    context: Optional[Dict[str, str]] = None


class EmailTemplatePreviewResponseDto(BaseModel):
    subject: str
    body: str


class EmailTemplateTestSendRequestDto(BaseModel):
    template: EmailTemplateUpsertDto
    context: Optional[Dict[str, str]] = None
    to: EmailStr


class EmailTemplateTestSendResponseDto(BaseModel):
    recipient: EmailStr
    message_id: str


class EmailTemplateMetaDto(BaseModel):
    key: EmailTemplateKey
    description: str
    available_variables: List[str]
    required_variables: List[str]


class EmailTemplatesMetaResponseDto(BaseModel):
    items: List[EmailTemplateMetaDto]


class EmailTemplateModel(DbModel):
    space_id: str
    key: EmailTemplateKey
    subject: str
    body: str
    updated_at: datetime


class UsersToChangePasswordDto(BaseModel):
    users: List[str]
    sendEmail: bool
    password: Optional[str] = None


class Result[T](BaseModel):
    value: Optional[T] = None
    error: Optional[str] = None


class ChangedPasswordDto(BaseModel):
    user: str
    password: Optional[str] = None
    password_error: Optional[str] = None
    email_sent: bool = False
    email_send_error: Optional[str] = None


class UsersAndRoomsDto(BaseModel):
    users: List[str]
    rooms: List[str]

class DeleteTeamDto(BaseModel):
    id: str
    rid: str

class UsersAndTeamsDto(BaseModel):
    users: List[str]
    teams: List[DeleteTeamDto]
    ban_in_rooms: bool = True


class UsersAndRoomResDto(BaseModel):
    success: bool = True
    error: Optional[str] = None
    user_list: List[str]
    room: str

class UsersAndTeamResDto(BaseModel):
    success: bool = True
    error: Optional[str] = None
    user_list: List[str]
    team: str

class TeamsDeleteDto(BaseModel):
    teams: List[str]
    delete_linked_rooms: bool = True

class RoomsDeleteDto(BaseModel):
    rooms: List[str]

class RoomsArchiveDto(BaseModel):
    rooms: List[str]

class RoomDeleteResDto(BaseModel):
    room: str
    success: bool = False
    error: Optional[str] = None

class RoomArchiveResDto(BaseModel):
    room: str
    success: bool = False
    error: Optional[str] = None

class UsersDeleteDto(BaseModel):
    users: List[str]
    force_delete: bool = True

class UserDeleteResDto(BaseModel):
    user: str
    force_delete: bool
    success: bool = False
    error: Optional[str] = None

class EmailTemplateUpsertDto(BaseModel):
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)

class EmailTemplateDto(BaseModel):
    key: str
    subject: str
    body: str

class EmailTemplatesMapDto(BaseModel):
    welcome_user: EmailTemplateDto
    password_changed: EmailTemplateDto

class EmailTemplatePreviewRequestDto(BaseModel):
    template: EmailTemplateUpsertDto
    context: Optional[Dict[str, str]] = None

class EmailTemplatePreviewResponseDto(BaseModel):
    subject: str
    body: str

class EmailTemplateTestSendRequestDto(BaseModel):
    template: EmailTemplateUpsertDto
    context: Optional[Dict[str, str]] = None
    to: EmailStr

class EmailTemplateTestSendResponseDto(BaseModel):
    recipient: EmailStr
    message_id: str


class UpdateTeamRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[int] = None  # 0 - public, 1 - private
