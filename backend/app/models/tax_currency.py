from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)
from sqlalchemy.sql import func

from app.db.base import Base


# ============================================================
# CURRENCY MASTER
# ============================================================

class Currency(Base):
    __tablename__ = "currencies"

    __table_args__ = {
        "schema": "procurement",
    }

    currency_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    currency_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        unique=True,
    )

    currency_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    currency_symbol: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )

    decimal_places: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=2,
    )

    is_base_currency: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ============================================================
# TAX CODE MASTER
# ============================================================

class TaxCode(Base):
    __tablename__ = "tax_codes"

    __table_args__ = {
        "schema": "procurement",
    }

    tax_code_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    tax_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        unique=True,
    )

    tax_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(7, 4),
        nullable=False,
        default=Decimal("0.0000"),
    )

    tax_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    country_code: Mapped[str | None] = mapped_column(
        String(3),
        nullable=True,
    )

    recoverable_percentage: Mapped[Decimal] = mapped_column(
        Numeric(7, 4),
        nullable=False,
        default=Decimal("100.0000"),
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# ============================================================
# EXCHANGE RATE MASTER
# ============================================================

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    __table_args__ = (
        UniqueConstraint(
            "from_currency_code",
            "to_currency_code",
            "effective_date",
            name="uq_exchange_rate",
        ),
        {
            "schema": "procurement",
        },
    )

    exchange_rate_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    from_currency_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        index=True,
    )

    to_currency_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="AUD",
        index=True,
    )

    exchange_rate: Mapped[Decimal] = mapped_column(
        Numeric(18, 8),
        nullable=False,
    )

    effective_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    rate_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="MANUAL",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )