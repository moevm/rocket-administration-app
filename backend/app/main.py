import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.features import spaces, users, roles, rooms, teams, settings, ldap
from app.features.relations import user_room, team_room
from app.services.db import database_lifespan

logger = logging.getLogger(__name__)
app = FastAPI(lifespan=database_lifespan)

# TODO: add to config
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/_health")
async def health():
    return "ok"

app.include_router(teams.router, prefix="/spaces/{space_id}/teams")
app.include_router(rooms.router, prefix="/spaces/{space_id}/rooms")
app.include_router(spaces.router, prefix="/spaces")
app.include_router(users.router, prefix="/spaces/{space_id}/users")
app.include_router(roles.router, prefix="/spaces/{space_id}/roles")
app.include_router(settings.router, prefix="/spaces/{space_id}/settings")
app.include_router(user_room.router, prefix="/spaces/{space_id}/user_room")
app.include_router(team_room.router, prefix="/spaces/{space_id}/team_room")
app.include_router(ldap.router, prefix="/spaces/{space_id}/ldap")

