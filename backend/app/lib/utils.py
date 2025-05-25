from asyncio import sleep
from typing import List, Awaitable, Callable, Tuple, TypeVar, ParamSpec, Iterable
from rocketchat_API.rocketchat import RocketChat
from app.lib.rocket import rocket_request, rocket_query_args
from datetime import datetime
from random import choice
from string import ascii_letters, digits
from app.models import Result
from fastapi import HTTPException

T = TypeVar("T")

P = ParamSpec("P")


async def batch_execute(
    func: Callable[P, Awaitable[T]], arguments: Iterable[P.args], delay: float
) -> List[T]:
    result = []
    for args in arguments:
        start = datetime.now()
        result.append(await func(*args))
        elapsed = datetime.now() - start
        if elapsed.total_seconds() < delay:
            await sleep(delay - elapsed.total_seconds())
    return result


def generate_password(length: int) -> str:
    return "".join(choice(ascii_letters + digits) for _ in range(length))


def extract_exception_message(exception: Exception) -> str:
    if isinstance(exception, HTTPException):
        return exception.detail
    else:
        return "Непредвиденная ошибка"

async def hide_system_messages(rocket: RocketChat, room_id: str):
    return await rocket_request(
                rocket.call_api_post,
                "rooms.saveRoomSettings",
                **rocket_query_args(
                    rid=room_id,
                    systemMessages=["uj","ujt","ul","ult","ru",
                                    "removed-user-from-team","au",
                                    "added-user-to-team","mute_unmute",
                                    "r","ut","wm","rm","subscription-role-added",
                                    "subscription-role-removed","room-archived",
                                    "room-unarchived","room_changed_privacy",
                                    "room_changed_avatar","room_changed_topic",
                                    "room_e2e_enabled","room_e2e_disabled",
                                    "room-removed-read-only","room-set-read-only",
                                    "room-disallowed-reacting","room-allowed-reacting",
                                    "user-added-room-to-team","user-converted-to-channel",
                                    "user-converted-to-team","user-deleted-room-from-team",
                                    "user-removed-room-from-team","room_changed_announcement",
                                    "room_changed_description"]
                )
            )
