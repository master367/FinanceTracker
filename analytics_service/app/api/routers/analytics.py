import io
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.transaction import TransactionList
from app.services.pdf_service import generate_pdf
from app.services.chart_service import generate_chart
from app.services.forecast_service import compute_forecast

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.post("/pdf")
def analytics_pdf(payload: TransactionList) -> StreamingResponse:
    """Generate and return a PDF report of transactions."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    buf: io.BytesIO = generate_pdf(data)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )

@router.post("/chart")
def analytics_chart(payload: TransactionList) -> StreamingResponse:
    """Generate and return a PNG pie chart of expenses by category."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    buf: io.BytesIO = generate_chart(data)
    return StreamingResponse(buf, media_type="image/png")

@router.post("/forecast")
def analytics_forecast(payload: TransactionList) -> dict[str, Any]:
    """Return a simple monthly expense forecast based on transaction history."""
    data: list[dict[str, Any]] = [t.model_dump() for t in payload.transactions]
    return compute_forecast(data)
