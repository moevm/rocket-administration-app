from fastapi import HTTPException
from typing import Optional

from app.models import SmtpSettingsDto
from aiosmtplib import SMTP
from pymongo.asynchronous.database import AsyncDatabase


async def validate_config(config: SmtpSettingsDto):
    smtp = SMTP(
        hostname=config.host.host,
        port=config.host.port
    )
    try:
        await smtp.connect()
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail='Ошибка подключения к SMTP-серверу')
    try:
        print(config.host.username or '', config.host.password or '')
        await smtp.login(config.host.username or '', config.host.password or '')
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail='Ошибка авторизации SMTP-сервера')

    await smtp.quit()

async def get_smtp_settings(db: AsyncDatabase, space_id: str) -> Optional[SmtpSettingsDto]:
    result = await db.smtp.find_one({
        'space_id':space_id
    })
    if result is None:
        return None

    return SmtpSettingsDto.model_validate(result)

async def set_smtp_settings(db: AsyncDatabase, space_id: str, settings: SmtpSettingsDto) :
    await db.smtp.update_one(
        {'space_id': space_id},
        {'$set': {
            **settings.model_dump(mode='json'),
            'space_id': space_id
        }},
        upsert=True
    )
