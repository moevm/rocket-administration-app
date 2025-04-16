import urllib
from asyncio import to_thread
from pprint import pprint

import requests
from fastapi import HTTPException
from rocketchat_API.APIExceptions.RocketExceptions import RocketAuthenticationException, RocketConnectionException
from rocketchat_API.rocketchat import RocketChat

from app.lib.cache import SpaceCacheKey

cache = {}

async def obtain_rocket_instance(key: SpaceCacheKey) -> RocketChat:
    if key not in cache:
        cache[key] = await create_rocket_instance(key)
    return cache[key]


async def create_rocket_instance(key: SpaceCacheKey) -> RocketChat:
    rocket = await rocket_interaction(
        RocketChat,
        user_id=key.user_id,
        auth_token=key.token,
        server_url=key.url
    )

    me = await rocket_request(rocket.me)
    if not 'admin' in me['roles']:
        raise HTTPException(status_code=400, detail="Ошибка доступа к RocketChat: Пользователь должен быть админом")

    return rocket


async def rocket_request(func, /, *args, **kwargs):
    response = await rocket_interaction(func, *args, **kwargs)

    if not (response.status_code == 200 and response.json()['success'] == True):
        pprint(response.status_code)
        pprint(response.json())
        raise HTTPException(status_code=400, detail="Ошибка запроса к RocketChat")

    json = response.json()
    del json['success']
    pprint(json)
    return json


async def rocket_interaction(func, /, *args, **kwargs):
    try:
        return await to_thread(func, *args, **kwargs)
    except RocketAuthenticationException:
        raise HTTPException(status_code=400, detail="Ошибка доступа к RocketChat: Неверные учетные данные")
    except (RocketConnectionException, requests.exceptions.ConnectionError):
        raise HTTPException(status_code=400,
                            detail="Ошибка доступа к RocketChat: Недействительный URL или проблема с подключением к серверу")


def rocket_query_args(**kwargs):
    def include_arg(key, value):
        return value is not None

    def map_value(value):
        if value is list:
            return [map_value(x) for x in value]
        if value is str:
            return urllib.parse.quote(value)
        return value

    return {key: map_value(value) for key, value in kwargs.items() if include_arg(key, value)}
