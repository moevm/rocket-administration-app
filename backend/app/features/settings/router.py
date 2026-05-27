from fastapi import APIRouter, Depends, HTTPException

from app.features.spaces.utils import get_space
from app.lib.smtp import validate_config
from app.lib.email_templates import (
    get_templates,
    save_template,
    preview_template,
    validate_template_variables
)
from app.models import (
    SmtpSettingsResponseDto, 
    SmtpSettingsDto,
    EmailTemplateUpsertDto,
    EmailTemplateDto,
    EmailTemplatePreviewRequestDto,
    EmailTemplatePreviewResponseDto,
    EmailTemplateTestSendRequestDto,
    EmailTemplateTestSendResponseDto,
    EmailTemplatesMapDto
)
from app.services.db import get_db
from app.lib import smtp
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/smtp")
async def get_smtp_settings(space=Depends(get_space), db=Depends(get_db)) -> SmtpSettingsResponseDto:
    result = await smtp.get_smtp_settings(db, space.id)
    return SmtpSettingsResponseDto(value=result)

@router.post("/smtp")
async def set_smtp_settings(request: SmtpSettingsDto, space=Depends(get_space), db=Depends(get_db)):
    await validate_config(request)
    await smtp.set_smtp_settings(db, space.id, request)


@router.get("/email-templates", response_model=EmailTemplatesMapDto)
async def get_email_templates(space=Depends(get_space), db=Depends(get_db)):
    templates = await get_templates(db, space.id)

    welcome_template = EmailTemplateDto(
        key="welcome_user",
        subject=templates.get("welcome_user", {}).get("subject", ""),
        body=templates.get("welcome_user", {}).get("body", "")
    )
    
    password_template = EmailTemplateDto(
        key="password_changed",
        subject=templates.get("password_changed", {}).get("subject", ""),
        body=templates.get("password_changed", {}).get("body", "")
    )
    
    return EmailTemplatesMapDto(
        welcome_user=welcome_template,
        password_changed=password_template
    )

@router.put("/email-templates/{key}")
async def update_email_template(
    key: str,
    template_data: EmailTemplateUpsertDto,
    space=Depends(get_space), 
    db=Depends(get_db)
):    
    if key not in ["welcome_user", "password_changed"]:
        raise HTTPException(status_code=400, detail="Invalid template key")

    await validate_template_variables(key, template_data.subject, template_data.body)
    saved = await save_template(db, space.id, key, template_data)
    
    return EmailTemplateDto(
        key=key,
        subject=saved.subject,
        body=saved.body
    )

@router.post("/email-templates/preview", response_model=EmailTemplatePreviewResponseDto)
async def preview_email_template(
    request: EmailTemplatePreviewRequestDto
):
    subject, body = await preview_template(
        template=request.template,
        context=request.context or {}
    )
    return EmailTemplatePreviewResponseDto(subject=subject, body=body)

@router.post("/email-templates/test-send", response_model=EmailTemplateTestSendResponseDto)
async def test_send_email_template(
    request: EmailTemplateTestSendRequestDto,
    space=Depends(get_space),
    db=Depends(get_db)
):
    smtp_config = await smtp.get_smtp_settings(db, space.id)
    if not smtp_config:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")

    subject, body = await preview_template(
        template=request.template,
        context=request.context or {}
    )
    
    message_id = await smtp.send_email(
        config=smtp_config,
        to=request.to,
        subject=subject,
        body=body
    )
    
    return EmailTemplateTestSendResponseDto(
        recipient=request.to,
        message_id=message_id
    )
