import logging
from typing import Dict, Optional
from fastapi import HTTPException
from pymongo.asynchronous.database import AsyncDatabase

from app.lib.email_templates import get_templates, render_template, DEFAULT_TEMPLATES
from app.lib import smtp
from app.models import SmtpSettingsDto

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, db: AsyncDatabase, space_id: str):
        self.db = db
        self.space_id = space_id
    
    async def _get_smtp_config(self) -> SmtpSettingsDto:
        smtp_config = await smtp.get_smtp_settings(self.db, self.space_id)
        if not smtp_config:
            raise HTTPException(
                status_code=400, 
                detail=f"SMTP settings not configured for space {self.space_id}"
            )
        return smtp_config

    async def _get_template(self, template_key: str, context: Dict[str, str]) -> tuple[str, str]:
        templates = await get_templates(self.db, self.space_id)
        template = templates.get(template_key)
        
        if not template:
            logger.warning(f"Template {template_key} not found, using default")
            from app.lib.email_templates import DEFAULT_TEMPLATES
            template = DEFAULT_TEMPLATES.get(template_key)

        subject = render_template(template.get("subject", ""), context)
        body = render_template(template.get("body", ""), context)
        
        return subject, body

    async def send_welcome_email(
        self, 
        to_email: str, 
        username: str, 
        password: str, 
        space_url: str
    ) -> str:
        context = {
            "username": username,
            "password": password,
            "space_url": space_url
        }
        
        subject, body = await self._get_template("welcome_user", context)

        smtp_config = await self._get_smtp_config()

        return await smtp.send_email(
            config=smtp_config, 
            to=to_email, 
            subject=subject, 
            body=body,
            is_html=True
        )
    
    async def send_password_changed_email(
        self, 
        to_email: str, 
        username: str, 
        password: str, 
        space_url: str
    ) -> str:
        context = {
            "username": username,
            "password": password,
            "space_url": space_url
        }
        
        subject, body = await self._get_template("password_changed", context)
        smtp_config = await self._get_smtp_config()

        return await smtp.send_email(
            config=smtp_config, 
            to=to_email, 
            subject=subject, 
            body=body,
            is_html=True
        )
