from fastapi import HTTPException
from typing import Optional

from app.models import SmtpSettingsDto
from aiosmtplib import SMTP
from pymongo.asynchronous.database import AsyncDatabase
from email.message import EmailMessage


async def validate_config(config: SmtpSettingsDto):
    smtp = SMTP(hostname=config.host.host, port=config.host.port)
    try:
        await smtp.connect()
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Ошибка подключения к SMTP-серверу")
    try:
        await smtp.login(config.host.username or "", config.host.password or "")
    except Exception as e:
        print(e)
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


async def send_email(config: SmtpSettingsDto, to: str, subject: str, message: str):
    async with SMTP(hostname=config.host.host, port=config.host.port) as smtp:
        await smtp.login(config.host.username or "", config.host.password or "")
        email_message = EmailMessage()
        email_message["From"] = config.sender
        email_message["To"] = to
        email_message["Subject"] = subject
        email_message.set_content(message)
        response = await smtp.send_message(email_message)
