from pydantic import BaseModel


class TransactionItem(BaseModel):
    id: int
    amount: float
    category: str | None = None
    date: str  # ISO date string, e.g. "2026-03-01"
    type: str  # "income" | "expense"


class TransactionList(BaseModel):
    transactions: list[TransactionItem]
