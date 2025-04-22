from fastapi import APIRouter, Depends, HTTPException

from app.features.spaces.utils import get_space
from app.lib.smtp import validate_config
from app.models import SmtpSettingsResponseDto, SmtpSettingsDto
from app.services.db import get_db
from app.lib import smtp

router = APIRouter()

@router.get("/smtp")
async def get_smtp_settings(space=Depends(get_space), db=Depends(get_db)) -> SmtpSettingsResponseDto:
    result = await smtp.get_smtp_settings(db, space.id)
    return SmtpSettingsResponseDto(value=result)

@router.post("/smtp")
async def set_smtp_settings(request: SmtpSettingsDto, space=Depends(get_space), db=Depends(get_db)):
    await validate_config(request)
    await smtp.set_smtp_settings(db, space.id, request)




