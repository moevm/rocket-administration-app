import sys
from contextlib import asynccontextmanager

from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure

from app.config import settings

mongodb_client = AsyncMongoClient(settings.mongo.uri)

@asynccontextmanager
async def database_lifespan(_):
    try:
        await mongodb_client.aconnect()
    except ConnectionFailure as e:
        print("Could not connect to MongoDB:", e)
        sys.exit(1)

    yield

    await mongodb_client.aclose()

async def get_db():
    return mongodb_client[settings.mongo.database]