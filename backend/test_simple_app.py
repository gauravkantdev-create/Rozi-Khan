#!/usr/bin/env python
import sys
sys.path.insert(0, '.')

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

app = FastAPI()

class TestRequest(BaseModel):
    email: EmailStr

@app.post("/test-direct")
def test_direct(data: TestRequest):
    return {"success": True, "email": data.email}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001, log_level="info")
