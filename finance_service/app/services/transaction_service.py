from datetime import date, datetime
from typing import List, Optional

from app.models.transaction import Transaction, TransactionType
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import TransactionCreate, TransactionUpdate, StatsResponse


class TransactionService:
    def __init__(self, repository: TransactionRepository):
        self.repository = repository

    def create_transaction(self, data: TransactionCreate) -> Transaction:
        transaction = Transaction.model_validate(
            data, update={"created_at": datetime.utcnow()}
        )
        return self.repository.create(transaction)

    def get_transaction(self, transaction_id: int) -> Optional[Transaction]:
        return self.repository.get_by_id(transaction_id)

    def list_transactions(
        self,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> List[Transaction]:
        return self.repository.list_transactions(from_date, to_date, category, tags)

    def update_transaction(
        self, transaction: Transaction, data: TransactionUpdate
    ) -> Transaction:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(transaction, key, value)
        return self.repository.update(transaction)

    def delete_transaction(self, transaction: Transaction) -> None:
        self.repository.delete(transaction)

    def get_monthly_stats(self, year: int, month: int) -> StatsResponse:
        income_sum = self.repository.get_stats_by_month(year, month, TransactionType.INCOME)
        expense_sum = self.repository.get_stats_by_month(year, month, TransactionType.EXPENSE)
        
        balance = income_sum - expense_sum
        return dict(
            year=year,
            month=month,
            income=income_sum,
            expense=expense_sum,
            balance=balance,
        )
