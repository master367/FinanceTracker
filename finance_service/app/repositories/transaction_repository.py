from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import func
from sqlmodel import Session, col, select

from app.models.transaction import Transaction, TransactionType


class TransactionRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, transaction: Transaction) -> Transaction:
        self.session.add(transaction)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction

    def get_by_id(self, transaction_id: int) -> Optional[Transaction]:
        return self.session.get(Transaction, transaction_id)

    def list_transactions(
        self,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
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

        return list(self.session.execute(statement).scalars().all())

    def update(self, transaction: Transaction) -> Transaction:
        self.session.add(transaction)
        self.session.commit()
        self.session.refresh(transaction)
        return transaction

    def delete(self, transaction: Transaction) -> None:
        self.session.delete(transaction)
        self.session.commit()

    def get_stats_by_month(
        self, year: int, month: int, type_: TransactionType
    ) -> float:
        start_date = datetime(year=year, month=month, day=1)
        if month == 12:
            end_date = datetime(year=year + 1, month=1, day=1)
        else:
            end_date = datetime(year=year, month=month + 1, day=1)

        result = self.session.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                col(Transaction.type) == type_,
                col(Transaction.created_at) >= start_date,
                col(Transaction.created_at) < end_date,
            )
        ).scalar_one()
        return float(result)
