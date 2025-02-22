import logging
import sys
from contextlib import asynccontextmanager

from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure

from app.config import settings

logger = logging.getLogger(__name__)

mongodb_client = AsyncMongoClient(settings.mongo.uri)

@asynccontextmanager
async def database_lifespan(_):
    try:
        logger.info("Connecting to MongoDB")
        await mongodb_client.aconnect()
        await mongodb_client.admin.command('ping')
        logger.info("Connected to MongoDB")
    except ConnectionFailure as e:
        logger.error("Could not connect to MongoDB:", exc_info=e)
        sys.exit(1)

    yield

    await mongodb_client.aclose()

async def get_db():
    return mongodb_client[settings.mongo.database]