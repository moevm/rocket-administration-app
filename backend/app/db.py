import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure

from app.config import settings

@asynccontextmanager
async def database_lifespan(app: FastAPI):
    try:
        mongodb_client = AsyncMongoClient(settings.mongo.uri)
        await mongodb_client.aconnect()
        app.db = mongodb_client[settings.mongo.database]
    except ConnectionFailure as e:
        print("Could not connect to MongoDB:", e)
        sys.exit(1)

    yield

    await mongodb_client.aclose()
