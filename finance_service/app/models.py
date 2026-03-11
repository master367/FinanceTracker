from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class TransactionBase(SQLModel):
    amount: float = Field(ge=0, description="Transaction amount, cannot be negative")
    description: Optional[str] = Field(default=None, max_length=255)
    type: TransactionType = Field(description="income or expense")
    category: Optional[str] = Field(default=None, max_length=100)
    # Comma-separated tags string for simplicity, e.g. "food,grocery"
    tags: Optional[str] = Field(default=None, max_length=255)


class Transaction(TransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        index=True,
    )


class TransactionCreate(TransactionBase):
    ...


class TransactionRead(TransactionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionUpdate(SQLModel):
    amount: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=255)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[str] = Field(default=None, max_length=255)
