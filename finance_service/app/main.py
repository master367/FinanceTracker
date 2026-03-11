from datetime import date, datetime
import os
from typing import Annotated, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlmodel import Session, col

from app.database import create_db_and_tables, get_session
from app.models import (
    Transaction,
    TransactionCreate,
    TransactionRead,
    TransactionType,
    TransactionUpdate,
)


app = FastAPI(title="Personal Finance Tracker")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SessionDep = Annotated[Session, Depends(get_session)]


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.post(
    "/transactions",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    data: TransactionCreate,
    session: SessionDep,
) -> Transaction:
    transaction = Transaction.model_validate(data, update={"created_at": datetime.utcnow()})
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction


@app.get("/transactions", response_model=List[TransactionRead])
def list_transactions(
    session: SessionDep,
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    category: Optional[str] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None, description="Filter by tags (comma-separated)"),
) -> List[Transaction]:
    statement = select(Transaction)

    if from_date:
        from_dt = datetime.combine(from_date, datetime.min.time())
        statement = statement.where(col(Transaction.created_at) >= from_dt)

    if to_date:
        to_dt = datetime.combine(to_date, datetime.max.time())
        statement = statement.where(col(Transaction.created_at) <= to_dt)

    if category:
        statement = statement.where(col(Transaction.category) == category)

    if tags:
        for tag in tags:
            statement = statement.where(col(Transaction.tags).ilike(f"%{tag}%"))

    statement = statement.order_by(col(Transaction.created_at).desc())

    results: List[Transaction] = list(session.execute(statement).scalars().all())
    return results


@app.get("/transactions/{transaction_id}", response_model=TransactionRead)
def get_transaction(
    transaction_id: int,
    session: SessionDep,
) -> Transaction:
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


@app.put("/transactions/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    session: SessionDep,
) -> Transaction:
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction


@app.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: int,
    session: SessionDep,
) -> None:
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    session.delete(transaction)
    session.commit()
    return None


@app.get("/stats")
def get_stats(
    session: SessionDep,
    year: int = Query(..., ge=1900, le=2100),
    month: int = Query(..., ge=1, le=12),
):
    start_date = datetime(year=year, month=month, day=1)
    if month == 12:
        end_date = datetime(year=year + 1, month=1, day=1)
    else:
        end_date = datetime(year=year, month=month + 1, day=1)

    income_sum = float(
        session.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                col(Transaction.type) == TransactionType.INCOME,
                col(Transaction.created_at) >= start_date,
                col(Transaction.created_at) < end_date,
            )
        ).scalar_one()
    )

    expense_sum = float(
        session.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                col(Transaction.type) == TransactionType.EXPENSE,
                col(Transaction.created_at) >= start_date,
                col(Transaction.created_at) < end_date,
            )
        ).scalar_one()
    )

    total_balance = income_sum - expense_sum

    return {
        "year": year,
        "month": month,
        "income": income_sum,
        "expense": expense_sum,
        "balance": total_balance,
    }
