from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float = Field(ge=0, description="Transaction amount, cannot be negative")
    description: Optional[str] = Field(default=None, max_length=255)
    type: TransactionType = Field(description="income or expense")
    category: Optional[str] = Field(default=None, max_length=100)
    # Comma-separated tags string for simplicity, e.g. "food,grocery"
    tags: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
    )
