from __future__ import annotations

import io
import os
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services import compute_forecast, generate_chart, generate_pdf

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------

app = FastAPI(title="Analytics Service", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TransactionItem(BaseModel):
    id: int
    amount: float
    category: str | None = None
    date: str  # ISO date string, e.g. "2026-03-01"
    type: str  # "income" | "expense"


class TransactionList(BaseModel):
    transactions: list[TransactionItem]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/ping")
def ping() -> dict[str, str]:
    """Health-check endpoint."""
    return {"status": "ok", "service": "analytics"}


# ---------------------------------------------------------------------------
# Analytics endpoints
# ---------------------------------------------------------------------------

@app.post("/api/analytics/pdf")
def analytics_pdf(payload: TransactionList) -> StreamingResponse:
    """Generate and return a PDF report of transactions."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    buf: io.BytesIO = generate_pdf(data)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )


@app.post("/api/analytics/chart")
def analytics_chart(payload: TransactionList) -> StreamingResponse:
    """Generate and return a PNG pie chart of expenses by category."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    buf: io.BytesIO = generate_chart(data)
    return StreamingResponse(buf, media_type="image/png")


@app.post("/api/analytics/forecast")
def analytics_forecast(payload: TransactionList) -> dict[str, Any]:
    """Return a simple monthly expense forecast based on transaction history."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    return compute_forecast(data)
