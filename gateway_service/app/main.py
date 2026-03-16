import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.proxy_client import lifespan
from app.api.routers import proxy

app = FastAPI(title="API Gateway", version="1.0.0", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    """Gateway liveness check."""
    return {"status": "ok", "service": "gateway"}

app.include_router(proxy.router)
