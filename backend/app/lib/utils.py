from asyncio import sleep
from typing import List, Awaitable, Callable, Tuple, TypeVar, ParamSpec, Iterable
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
