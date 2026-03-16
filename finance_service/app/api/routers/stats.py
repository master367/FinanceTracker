from fastapi import APIRouter, Query

from app.api.dependencies import ServiceDep
from app.schemas.transaction import StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsResponse)
def get_stats(
    service: ServiceDep,
    year: int = Query(..., ge=1900, le=2100),
    month: int = Query(..., ge=1, le=12),
) -> StatsResponse:
    return service.get_monthly_stats(year, month)
