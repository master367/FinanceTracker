from datetime import date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies import ServiceDep
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post(
    "",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    data: TransactionCreate,
    service: ServiceDep,
) -> Transaction:
    return service.create_transaction(data)

@router.get("", response_model=List[TransactionRead])
def list_transactions(
    service: ServiceDep,
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    category: Optional[str] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None, description="Filter by tags (comma-separated)"),
) -> List[Transaction]:
    return service.list_transactions(from_date, to_date, category, tags)

@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(
    transaction_id: int,
    service: ServiceDep,
) -> Transaction:
    transaction = service.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction

@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    service: ServiceDep,
) -> Transaction:
    transaction = service.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return service.update_transaction(transaction, data)

@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transaction(
    transaction_id: int,
    service: ServiceDep,
) -> None:
    transaction = service.get_transaction(transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    service.delete_transaction(transaction)
