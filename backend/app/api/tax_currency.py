from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.tax_currency import (
    Currency,
    ExchangeRate,
    TaxCode,
)

from app.schemas.tax_currency import (
    CurrencyResponse,
    ExchangeRateResponse,
    TaxCodeResponse,
)


router = APIRouter(
    prefix="/api/v1/reference",
    tags=["Tax & Currency"],
)


# ============================================================
# CURRENCIES
# ============================================================

@router.get(
    "/currencies",
    response_model=list[
        CurrencyResponse
    ],
)
def get_currencies(
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(
                Currency
            )
            .where(
                Currency.is_active.is_(
                    True
                )
            )
            .order_by(
                Currency.currency_code
            )
        ).all()
    )


# ============================================================
# TAX CODES
# ============================================================

@router.get(
    "/tax-codes",
    response_model=list[
        TaxCodeResponse
    ],
)
def get_tax_codes(
    db: Session = Depends(get_db),
):
    return list(
        db.scalars(
            select(
                TaxCode
            )
            .where(
                TaxCode.is_active.is_(
                    True
                )
            )
            .order_by(
                TaxCode.tax_code
            )
        ).all()
    )


# ============================================================
# LATEST EXCHANGE RATE
# ============================================================

@router.get(
    "/exchange-rates/latest",
    response_model=ExchangeRateResponse | None,
)
def get_latest_exchange_rate(
    from_currency: str = Query(
        ...,
        min_length=3,
        max_length=3,
    ),
    to_currency: str = Query(
        default="AUD",
        min_length=3,
        max_length=3,
    ),
    db: Session = Depends(get_db),
):
    from_code = (
        from_currency
        .strip()
        .upper()
    )

    to_code = (
        to_currency
        .strip()
        .upper()
    )

    # AUD -> AUD does not need an exchange-rate record.
    if from_code == to_code:
        return None

    exchange_rate = db.scalar(
        select(
            ExchangeRate
        )
        .where(
            ExchangeRate.from_currency_code
            == from_code,
            ExchangeRate.to_currency_code
            == to_code,
            ExchangeRate.is_active.is_(
                True
            ),
            ExchangeRate.effective_date
            <= date.today(),
        )
        .order_by(
            ExchangeRate.effective_date.desc(),
            ExchangeRate.exchange_rate_id.desc(),
        )
        .limit(1)
    )

    if exchange_rate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No active exchange rate found "
                f"for {from_code} -> {to_code}."
            ),
        )

    return exchange_rate