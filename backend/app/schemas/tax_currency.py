from datetime import date, datetime
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
)


# ============================================================
# CURRENCY
# ============================================================

class CurrencyResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    currency_id: int

    currency_code: str
    currency_name: str
    currency_symbol: str | None

    decimal_places: int

    is_base_currency: bool
    is_active: bool

    created_at: datetime
    updated_at: datetime


# ============================================================
# TAX CODE
# ============================================================

class TaxCodeResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    tax_code_id: int

    tax_code: str
    tax_name: str

    tax_rate: Decimal
    tax_type: str

    country_code: str | None

    recoverable_percentage: Decimal

    is_active: bool

    created_at: datetime
    updated_at: datetime


# ============================================================
# EXCHANGE RATE
# ============================================================

class ExchangeRateResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    exchange_rate_id: int

    from_currency_code: str
    to_currency_code: str

    exchange_rate: Decimal

    effective_date: date

    rate_source: str | None

    is_active: bool

    created_at: datetime
    updated_at: datetime