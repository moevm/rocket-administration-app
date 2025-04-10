import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from aiosmtplib import SMTP

from app.services.db import database_lifespan
from app.features import spaces, users, roles
from app.config import settings

logger = logging.getLogger(__name__)
app = FastAPI(lifespan=database_lifespan)

# TODO: add to config
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/_health")
async def health():
    return "ok"

app.include_router(spaces.router, prefix="/spaces")
app.include_router(users.router, prefix="/spaces/{space_id}/users")
app.include_router(roles.router, prefix="/spaces/{space_id}/roles")

class EmailRequest(BaseModel):
    subject: str
    recipient: EmailStr
    body: str

@app.post("/send-email")
async def send_email(email_request: EmailRequest):
    try:
        async with SMTP(hostname=settings.smtp.host, port=settings.smtp.port) as smtp:
            print(settings.smtp.user, settings.smtp.password)
            await smtp.login(settings.smtp.user, settings.smtp.password)

            message = f"Subject: {email_request.subject}\n\n{email_request.body}"
            await smtp.sendmail(settings.smtp.user, email_request.recipient, message)

        return {"detail": "Email sent successfully"}
    except Exception as e:
        print(type(e), e)
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")

