from typing import Annotated, Iterator

from fastapi import Depends
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.transaction_repository import TransactionRepository
from app.services.transaction_service import TransactionService


# Dependencies
SessionDep = Annotated[Session, Depends(get_session)]

def get_transaction_repository(session: SessionDep) -> TransactionRepository:
    return TransactionRepository(session)


RepositoryDep = Annotated[TransactionRepository, Depends(get_transaction_repository)]


def get_transaction_service(repository: RepositoryDep) -> TransactionService:
    return TransactionService(repository)


ServiceDep = Annotated[TransactionService, Depends(get_transaction_service)]
