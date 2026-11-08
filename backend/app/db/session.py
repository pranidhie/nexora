"""Database engine and session management."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def normalise_database_url(database_url: str) -> str:
    """Use the psycopg v3 SQLAlchemy driver for PostgreSQL URLs."""

    cleaned_url = database_url.strip()

    if cleaned_url.startswith("postgres://"):
        return cleaned_url.replace(
            "postgres://",
            "postgresql+psycopg://",
            1,
        )

    if cleaned_url.startswith("postgresql://"):
        return cleaned_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1,
        )

    return cleaned_url


engine = create_engine(
    normalise_database_url(
        settings.database_url,
    ),
    echo=settings.debug,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Provide one database session per request."""

    database_session = SessionLocal()

    try:
        yield database_session
    finally:
        database_session.close()