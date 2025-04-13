from pydantic import BaseModel, Field
from typing import List, Optional

class PaginatedTeamResponseDto(BaseModel):
    count: int
    offset: int
    total: int

class CreatedByDto(BaseModel):
    id: str = Field(alias='_id')
    username: str

class TeamDto(BaseModel):
    id: str = Field(alias='_id')
    name: Optional[str] = None
    type: Optional[int] = None
    createdAt: Optional[str] = None
    createdBy: Optional[CreatedByDto] = None
    updatedAt: Optional[str] = None
    roomId: Optional[str] = None
    rooms: Optional[int] = None
    numberOfUsers: Optional[int] = None

class TeamResponseDto(PaginatedTeamResponseDto):
    teams: List[TeamDto]