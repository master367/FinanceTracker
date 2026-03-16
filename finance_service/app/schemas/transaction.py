from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class TransactionBase(BaseModel):
    amount: float = Field(ge=0, description="Transaction amount, cannot be negative")
    description: Optional[str] = Field(default=None, max_length=255)
    type: TransactionType = Field(description="income or expense")
    category: Optional[str] = Field(default=None, max_length=100)
    # Comma-separated tags string for simplicity, e.g. "food,grocery"
    tags: Optional[str] = Field(default=None, max_length=255)


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=255)
    type: Optional[TransactionType] = None
    category: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[str] = Field(default=None, max_length=255)


class StatsResponse(BaseModel):
    year: int
    month: int
    income: float
    expense: float
    balance: float
