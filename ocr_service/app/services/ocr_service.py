from typing import Any

from app.integrations.gemini_client import GeminiClient
from app.integrations.finance_client import FinanceClient

class OCRService:
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.finance_client = FinanceClient()

    async def process_receipt(self, image_bytes: bytes, mime_type: str) -> dict[str, Any]:
        """
        Coordination logic: get data from Gemini, build payload, and send to Finance.
        """
        # 1. Ask Gemini to extract data
        extracted = await self.gemini_client.analyze_receipt(image_bytes, mime_type)

        # 2. Build finance-api payload
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

        # 3. Create transaction via FinanceClient
        created_transaction = await self.finance_client.create_transaction(transaction_payload)
        
        return created_transaction
