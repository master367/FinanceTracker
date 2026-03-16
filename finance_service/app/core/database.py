from typing import Iterator
import os

from sqlmodel import SQLModel, Session, create_engine


# Example: postgresql+psycopg://user:password@localhost:5432/finances
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")


engine = create_engine(
    DATABASE_URL,
    echo=False,
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
