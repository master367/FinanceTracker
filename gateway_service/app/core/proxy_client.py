import httpx
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, Response

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


async def proxy_request(request: Request, upstream_url: str) -> Response:
    """
    Forward *request* to *upstream_url* and return the upstream response.
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
