from typing import List

from pydantic import BaseModel, Field


class RoleDto(BaseModel):
    id: str = Field(alias='_id')
    scope: str
    description: str
    mandatory2fa: bool
    name: str
    protected: bool

class RolesResponseDto(BaseModel):
    roles: List[RoleDto]