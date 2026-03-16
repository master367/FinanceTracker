from fastapi import APIRouter, Request, Response

from app.core.proxy_client import proxy_request


router = APIRouter()

# Upstream service base URLs (Docker internal hostnames)
FINANCE_BASE   = "http://finance-api:8000"
ANALYTICS_BASE = "http://analytics-api:8000"


@router.api_route(
    "/api/v1/finance/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def finance_proxy(request: Request, path: str) -> Response:
    """Proxy /api/v1/finance/<path> → finance-api:8000/<path>"""
    target = f"{FINANCE_BASE}/{path}"
    return await proxy_request(request, target)


@router.api_route(
    "/api/v1/analytics/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def analytics_proxy(request: Request, path: str) -> Response:
    """Proxy /api/v1/analytics/<path> → analytics-api:8000/<path>"""
    target = f"{ANALYTICS_BASE}/{path}"
    return await proxy_request(request, target)


@router.api_route(
    "/api/v1/ocr/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def ocr_proxy(request: Request, path: str) -> Response:
    """Proxy /api/v1/ocr/<path> → ocr-api:8000/<path>"""
    target = f"http://ocr-api:8000/api/v1/ocr/{path}"
    return await proxy_request(request, target)
