import re
from typing import Dict, Optional, Tuple, Any
from datetime import datetime
from fastapi import HTTPException
from pymongo.asynchronous.database import AsyncDatabase
import logging

logger = logging.getLogger(__name__)

from app.models import EmailTemplateUpsertDto

TOKEN_PATTERN = re.compile(r"{{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*}}")

DEFAULT_TEMPLATES = {
    "welcome_user": {
        "subject": "Ваш аккаунт в {{space_url}} создан",
        "body": """<div>
            <h2>Добро пожаловать, {{username}}!</h2>
            <p>Ваш аккаунт успешно создан.</p>
            <p><strong>Временный пароль:</strong> {{password}}</p>
            <p><strong>Пространство:</strong> <a href="{{space_url}}">{{space_url}}</a></p>
        </div>"""
    },
    "password_changed": {
        "subject": "Пароль изменен в {{space_url}}",
        "body": """<div>
            <h2>Здравствуйте, {{username}}!</h2>
            <p>Ваш пароль был изменен.</p>
            <p><strong>Новый пароль:</strong> {{password}}</p>
            <p><strong>Пространство:</strong> <a href="{{space_url}}">{{space_url}}</a></p>
        </div>"""
    }
}

TEMPLATE_CONFIGS = {
    "welcome_user": {
        "available_variables": ["username", "space_url", "password"],
        "required_variables": ["space_url", "password"]
    },
    "password_changed": {
        "available_variables": ["username", "space_url", "password"],
        "required_variables": ["space_url", "password"]
    }
}

def extract_variables(content: str) -> list[str]:
    if not content:
        return []
    return [match.group(1) for match in TOKEN_PATTERN.finditer(content)]

def render_template(template: str, context: Dict[str, str]) -> str:
    if not template:
        return ""
    
    def replace(match):
        var = match.group(1)
        return context.get(var, match.group(0))
    
    return TOKEN_PATTERN.sub(replace, template)

async def validate_template_variables(key: str, subject: str, body: str):
    config = TEMPLATE_CONFIGS.get(key)
    if not config:
        return
    
    full_content = f"{subject or ''}\n{body or ''}"
    used_vars = set(extract_variables(full_content))

    missing = [v for v in config["required_variables"] if v not in used_vars]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required variables: {', '.join(missing)}"
        )
    
    unknown = [v for v in used_vars if v not in config["available_variables"]]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown variables: {', '.join(unknown)}"
        )

async def get_templates(db: AsyncDatabase, space_id: str) -> Dict:
    settings_collection = db.settings
    settings = await settings_collection.find_one({"space_id": space_id})
    
    saved_templates = {}
    if settings:
        saved_templates = settings.get("email_templates", {})
    else:
        logger.warning(f"No settings document found for space {space_id}, will use defaults")

        await settings_collection.update_one(
            {"space_id": space_id},
            {"$set": {"space_id": space_id, "created_at": datetime.utcnow()}},
            upsert=True
        )

    result = {}
    for key in DEFAULT_TEMPLATES:
        if key in saved_templates:
            result[key] = saved_templates[key]
            logger.debug(f"Using saved template for {key}")
        else:
            result[key] = DEFAULT_TEMPLATES[key]
            logger.debug(f"Using default template for {key}")
    
    return result


async def save_template(
    db: AsyncDatabase, 
    space_id: str, 
    key: str, 
    template: EmailTemplateUpsertDto
) -> EmailTemplateUpsertDto:
    settings_collection = db.settings
    
    existing = await settings_collection.find_one({"space_id": space_id})
    logger.info(f"Existing settings document: {existing is not None}")

    update_data = {
        "$set": {
            f"email_templates.{key}": {
                "subject": template.subject,
                "body": template.body
            },
            "updated_at": datetime.utcnow(),
            "space_id": space_id
        }
    }

    result = await settings_collection.update_one(
        {"space_id": space_id},
        update_data,
        upsert=True
    )

    saved = await settings_collection.find_one({"space_id": space_id})
    if saved:
        logger.info(f"Saved templates keys: {list(saved.get('email_templates', {}).keys())}")
    else:
        logger.error("Failed to save! No document found after update! nooooo")
    
    return template

async def preview_template(
    template: EmailTemplateUpsertDto,
    context: Optional[Dict[str, str]] = None
) -> Tuple[str, str]:
    sample_context = {
        "username": "test_user",
        "space_url": "https://example.space",
        "password": "IplayPokemonGoeveryday",
        **(context or {})
    }
    
    subject = render_template(template.subject, sample_context)
    body = render_template(template.body, sample_context)
    
    return subject, body