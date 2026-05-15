from fastapi import HTTPException
from typing import Optional
from urllib.parse import urlparse, unquote
from app.models import SmtpSettingsDto
from aiosmtplib import SMTP
from pymongo.asynchronous.database import AsyncDatabase
from email.message import EmailMessage
import logging

logger = logging.getLogger(__name__)

def parse_smtp_url(url: str) -> tuple[str, int, str, str]:
    parsed = urlparse(url)
    
    host = parsed.hostname or "localhost"
    port = parsed.port or 587
    username = unquote(parsed.username) if parsed.username else None
    password = unquote(parsed.password) if parsed.password else None
    
    return host, port, username, password

def _get_credentials(config: SmtpSettingsDto) -> tuple[Optional[str], Optional[str]]:
    """
    Извлекает и деэкранирует имя пользователя и пароль из конфигурации SMTP.
    Поддерживает оба формата: отдельные поля или URL с credentials.
    """
    if hasattr(config.host, 'username') and config.host.username:
        username = unquote(config.host.username)
        password = unquote(config.host.password) if config.host.password else ""
        return username, password

    host_str = str(config.host)
    _, _, username, password = parse_smtp_url(host_str)
    return username, password

async def validate_config(config: SmtpSettingsDto):
    username, password = _get_credentials(config)

    host_str = str(config.host)
    if hasattr(config.host, 'host'):
        host = config.host.host
        port = config.host.port or 587
    else:
        host, port, _, _ = parse_smtp_url(host_str)
    
    smtp = SMTP(hostname=host, port=port, use_tls=config.use_tls)
    try:
        await smtp.connect()
        logger.info(f"SMTP connection successful to {host}:{port}")
    except Exception as e:
        logger.error(f"SMTP connection failed: {e}")
        raise HTTPException(status_code=400, detail="Ошибка подключения к SMTP-серверу")
    
    if username and password:
        try:
            await smtp.login(username, password)
            logger.info(f"SMTP authentication successful for {username}")
        except Exception as e:
            logger.error(f"SMTP authentication failed: {e}")
            raise HTTPException(status_code=400, detail="Ошибка авторизации SMTP-сервера")
    
    await smtp.quit()

async def get_smtp_settings(
    db: AsyncDatabase, space_id: str
) -> Optional[SmtpSettingsDto]:
    result = await db.smtp.find_one({"space_id": space_id})
    if result is None:
        return None
    
    return SmtpSettingsDto.model_validate(result)

async def set_smtp_settings(
    db: AsyncDatabase, space_id: str, settings: SmtpSettingsDto
):
    await db.smtp.update_one(
        {"space_id": space_id},
        {"$set": {**settings.model_dump(mode="json"), "space_id": space_id}},
        upsert=True,
    )


async def require_smtp_settings(db: AsyncDatabase, space_id: str) -> SmtpSettingsDto:
    settings = await get_smtp_settings(db, space_id)

    if settings is None:
        raise HTTPException(status_code=400, detail="SMTP-сервер не настроен")

    return settings


async def send_email(
    config: SmtpSettingsDto, 
    to: str, 
    subject: str, 
    body: str,
    is_html: bool = True
) -> str:
    try:
        username, password = _get_credentials(config)
        host_str = str(config.host)
        if hasattr(config.host, 'host'):
            host = config.host.host
            port = config.host.port or 587
        else:
            host, port, _, _ = parse_smtp_url(host_str)
        
        logger.info(f"Sending email to {to} via {host}:{port}")
        
        async with SMTP(
            hostname=host, 
            port=port, 
            use_tls=config.use_tls
        ) as smtp:
            if username and password:
                await smtp.login(username, password)

            email_message = EmailMessage()
            email_message["From"] = str(config.sender)
            email_message["To"] = to
            email_message["Subject"] = subject

            if is_html:
                email_message.set_content(body, subtype="html")
            else:
                email_message.set_content(body)
            response = await smtp.send_message(email_message)
            logger.info(f"Email sent successfully to {to}")
            return str(response)
            
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send email: {str(e)}"
        )
