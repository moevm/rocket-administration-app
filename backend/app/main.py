import uvicorn
from fastapi import FastAPI

from app.db import database_lifespan

app = FastAPI(lifespan=database_lifespan)
counter = 0

@app.get("/")
async def root():
    global counter
    await app.db.testcollection.insert_one({"id": counter, "biba": "boba"})
    counter += 1
    results = []
    async for doc in app.db.testcollection.find():
        doc.pop("_id")
        results.append(doc)
    return results


def start():
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
