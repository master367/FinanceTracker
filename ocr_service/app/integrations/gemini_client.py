import json
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings

class GeminiClient:
    def __init__(self):
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._model_name = "gemini-3-flash-preview"
        self._prompt = (
            "Проанализируй этот чек. Извлеки данные и верни СТРОГО валидный JSON "
            "с ключами: \"amount\" (число), \"date\" (строка YYYY-MM-DD), "
            "\"description\" (строка). Никакого лишнего текста, только JSON."
        )

    async def analyze_receipt(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """
        Send image to Gemini and parse the JSON response.
        """
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        response = await self._client.aio.models.generate_content(
            model=self._model_name,
            contents=[self._prompt, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0,
            ),
        )

        raw_text = response.text
        if not raw_text:
            raise ValueError("Gemini вернул пустой ответ. Попробуйте другое фото.")

        try:
            extracted: dict[str, Any] = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Gemini не вернул валидный JSON. Ответ: {raw_text!r}"
            ) from exc

        return extracted
