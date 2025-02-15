import uvicorn
from fastapi import FastAPI
from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure
from config import settings
import sys

app = FastAPI()

@app.on_event("startup")
async def startup_db_client():
    try:
        app.mongodb_client = AsyncMongoClient(settings.mongo.uri)
        await app.mongodb_client.aconnect()
        print("Connected to MongoDB.")
        app.database = app.mongodb_client[settings.mongo.db]
    except ConnectionFailure as e:
        print("Could not connect to MongoDB:", e)
        sys.exit(1)

@app.on_event("shutdown")
async def shutdown_db_client():
    await app.mongodb_client.aclose()
    print("Disconnected from MongoDB.")

counter = 0

@app.get("/")
async def root():
    global counter
    testcollection = app.database.testcollection
    await testcollection.insert_one({"id": counter, "biba": "boba"})
    counter += 1
    results = []
    async for doc in testcollection.find():
        doc.pop("_id")
        results.append(doc)
    return results


def start():
    uvicorn.run("rocketapp.main:app", host="0.0.0.0", port=8000, reload=True)
