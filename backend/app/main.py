import uvicorn
from fastapi import FastAPI, Depends

from app.db import database_lifespan, get_db

app = FastAPI(lifespan=database_lifespan)
counter = 0

@app.get("/")
async def root(db=Depends(get_db)):
    global counter
    await db.testcollection.insert_one({"id": counter, "biba": "boba"})
    counter += 1
    results = []
    async for doc in db.testcollection.find():
        doc.pop("_id")
        results.append(doc)
    return results


def start():
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
