"""
Gemini-powered receipt OCR logic.

Uses the new `google-genai` SDK (replaces the deprecated `google-generativeai`).

Flow:
  1. Receive raw image bytes + MIME type
  2. Call gemini-2.0-flash via REST (not gRPC) with the image and a JSON prompt
  3. Parse the returned JSON (amount, date, description)
  4. POST to http://finance-api:8000/transactions to create the expense
  5. Return the created transaction dict
"""

from __future__ import annotations

import json
from typing import Any

import httpx
from google import genai
from google.genai import types

from app.config import settings

# Create client using the newer google-genai SDK
_CLIENT = genai.Client(api_key=settings.gemini_api_key)

_MODEL_NAME = "gemini-3-flash-preview"  # fallback to flash-8b (valid in new SDK and has free quota)

_PROMPT = (
    "Проанализируй этот чек. Извлеки данные и верни СТРОГО валидный JSON "
    "с ключами: \"amount\" (число), \"date\" (строка YYYY-MM-DD), "
    "\"description\" (строка). Никакого лишнего текста, только JSON."
)

_FINANCE_API = "http://finance-api:8000"


async def process_receipt(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """
    Run the receipt image through Gemini and persist the result in finance-api.

    Args:
        image_bytes: Raw bytes of the uploaded image.
        mime_type:   MIME type such as "image/jpeg" or "image/png".

    Returns:
        The transaction dict returned by finance-api (201 Created body).

    Raises:
        ValueError:   When Gemini returns empty output or invalid JSON.
        RuntimeError: When finance-api rejects the transaction.
    """
    # ---- 1. Build inline image part for the new SDK ----
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    # ---- 2. Call Gemini via REST (async) ----
    response = await _CLIENT.aio.models.generate_content(
        model=_MODEL_NAME,
        contents=[_PROMPT, image_part],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0,
        ),
    )

    raw_text = response.text
    if not raw_text:
        raise ValueError("Gemini вернул пустой ответ. Попробуйте другое фото.")

    # ---- 3. Parse JSON ----
    try:
        extracted: dict[str, Any] = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Gemini не вернул валидный JSON. Ответ: {raw_text!r}"
        ) from exc

    # ---- 4. Build transaction payload ----
    amount = float(extracted.get("amount") or 0)
    if amount <= 0:
        raise ValueError(f"Некорректная сумма из чека: {amount}")

    description = str(extracted.get("description") or "Чек")[:255]

    transaction_payload: dict[str, Any] = {
        "amount": amount,
        "description": description,
        "type": "expense",
        "category": "OCR / Чек",
    }

    # ---- 5. POST to finance-api (direct internal call, no gateway hop) ----
    async with httpx.AsyncClient(timeout=30.0) as client:
        finance_resp = await client.post(
            f"{_FINANCE_API}/transactions",
            json=transaction_payload,
        )

    if finance_resp.status_code != 201:
        raise RuntimeError(
            f"finance-api вернул {finance_resp.status_code}: {finance_resp.text}"
        )

    return finance_resp.json()
