import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.db import database_lifespan
from app.features import spaces, users

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
