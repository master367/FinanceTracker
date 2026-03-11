from __future__ import annotations

import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Import config first so key validation runs before anything else
from app.config import settings  # noqa: F401 — side-effect: validates key
from app.services import process_receipt

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


@app.post("/api/v1/ocr/scan")
async def scan_receipt(file: UploadFile = File(...)):
    """
    Accepts a receipt image, sends it to Gemini, and saves the detected
    transaction in finance-api.

    Returns the newly created transaction object.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Только изображения разрешены. Получено: {file.content_type!r}",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Файл пустой.")

    try:
        transaction = await process_receipt(image_bytes, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {exc}")

    return {
        "message": "Чек успешно распознан и сохранён",
        "transaction": transaction,
    }
