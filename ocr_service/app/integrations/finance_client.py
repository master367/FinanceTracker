from typing import Any
import httpx

class FinanceClient:
    def __init__(self):
        self._finance_api = "http://finance-api:8000"

    async def create_transaction(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Send a POST request to finance-api to create a transaction.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self._finance_api}/transactions",
                json=payload,
            )

        if response.status_code != 201:
            raise RuntimeError(
                f"finance-api вернул {response.status_code}: {response.text}"
            )

        return response.json()
