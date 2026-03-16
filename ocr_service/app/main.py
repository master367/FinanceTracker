import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import config first so key validation runs before anything else
from app.core.config import settings  # noqa: F401 — side-effect: validates key
from app.api.routers import ocr

app = FastAPI(title="OCR Service", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
async def ping() -> dict:
    return {"status": "ok", "service": "ocr"}

app.include_router(ocr.router)
