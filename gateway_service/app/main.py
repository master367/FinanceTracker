"""
API Gateway — transparent reverse proxy built on FastAPI + httpx.

Routing rules
─────────────
  /api/v1/finance/{path}   →  http://finance-api:8000/{path}
  /api/v1/analytics/{path} →  http://analytics-api:8000/{path}

Design notes
────────────
• A single shared httpx.AsyncClient is created once at startup (lifespan)
  and reused for every request.  This avoids the overhead of re-establishing
  TCP connections on every call and leverages HTTP keep-alive automatically.

• Query strings, request body and the most relevant headers are forwarded
  verbatim. We strip hop-by-hop headers (host, connection, …) that must NOT
  be forwarded to upstream services.

• The upstream status code and raw body are returned to the browser unchanged,
  so the frontend never needs to know that a proxy is in the middle.
"""

from __future__ import annotations

import httpx
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware


# ---------------------------------------------------------------------------
# Upstream service base URLs (Docker internal hostnames)
# ---------------------------------------------------------------------------
FINANCE_BASE   = "http://finance-api:8000"
ANALYTICS_BASE = "http://analytics-api:8000"

# Headers that must NOT be forwarded to upstream (hop-by-hop)
_HOP_BY_HOP = frozenset(
    {
        "host",
        "connection",
        "keep-alive",
        "transfer-encoding",
        "te",
        "trailers",
        "upgrade",
        "proxy-authorization",
        "proxy-authenticate",
    }
)


# ---------------------------------------------------------------------------
# Shared httpx client — created once, reused across all requests
# ---------------------------------------------------------------------------
class _State:
    client: httpx.AsyncClient


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # timeout: 300 s total (increased for slow OCR tasks); follow redirects from upstreams
    _State.client = httpx.AsyncClient(timeout=300.0, follow_redirects=True)
    try:
        yield
    finally:
        await _State.client.aclose()


# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = FastAPI(title="API Gateway", version="1.0.0", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Generic proxy helper
# ---------------------------------------------------------------------------
async def _proxy(request: Request, upstream_url: str) -> Response:
    """
    Forward *request* to *upstream_url* and return the upstream response.

    Steps:
    1. Strip hop-by-hop headers from the incoming request.
    2. Read the full body (needed for POST/PUT; empty bytes for GET/DELETE).
    3. Send to upstream with httpx, preserving method, query string, body.
    4. Strip hop-by-hop headers from the upstream response.
    5. Return a FastAPI Response with the upstream status code + body.
    """
    # 1. Build forwarded headers
    forward_headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    # 2. Read body (streaming-safe; empty bytes for bodyless methods)
    body = await request.body()

    # 3. Proxy the request
    upstream_response = await _State.client.request(
        method=request.method,
        url=upstream_url,
        headers=forward_headers,
        content=body,
        params=request.query_params,  # preserve ?foo=bar&…
    )

    # 4. Filter upstream response headers
    response_headers = {
        k: v
        for k, v in upstream_response.headers.items()
        if k.lower() not in _HOP_BY_HOP
    }

    # 5. Return raw response to browser
    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=upstream_response.headers.get("content-type"),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.api_route(
    "/api/v1/finance/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def finance_proxy(request: Request, path: str) -> Response:
    """
    Proxy /api/v1/finance/<path> → finance-api:8000/<path>

    Example:
        GET /api/v1/finance/transactions?from_date=2026-01-01
        → GET http://finance-api:8000/transactions?from_date=2026-01-01
    """
    target = f"{FINANCE_BASE}/{path}"
    return await _proxy(request, target)


@app.api_route(
    "/api/v1/analytics/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def analytics_proxy(request: Request, path: str) -> Response:
    """
    Proxy /api/v1/analytics/<path> → analytics-api:8000/<path>

    Example:
        POST /api/v1/analytics/api/analytics/pdf
        → POST http://analytics-api:8000/api/analytics/pdf
    """
    target = f"{ANALYTICS_BASE}/{path}"
    return await _proxy(request, target)


@app.api_route(
    "/api/v1/ocr/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
)
async def ocr_proxy(request: Request, path: str) -> Response:
    """
    Proxy /api/v1/ocr/<path> → ocr-api:8000/<path>

    Example:
        POST /api/v1/ocr/scan (multipart image)
        → POST http://ocr-api:8000/api/v1/ocr/scan
    """
    target = f"http://ocr-api:8000/api/v1/ocr/{path}"
    return await _proxy(request, target)


@app.get("/health")
async def health() -> dict:
    """Gateway liveness check."""
    return {"status": "ok", "service": "gateway"}
