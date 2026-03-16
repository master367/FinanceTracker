from fastapi import APIRouter, File, HTTPException, UploadFile
from typing import Any

from app.services.ocr_service import OCRService

router = APIRouter(prefix="/api/v1/ocr", tags=["ocr"])

@router.post("/scan")
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

    ocr_service = OCRService()

    try:
        transaction = await ocr_service.process_receipt(image_bytes, file.content_type)
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
