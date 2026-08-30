from decimal import Decimal

from sqlalchemy import (
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    __table_args__ = {
        "schema": "procurement"
    }

    purchase_order_item_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    purchase_order_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.purchase_orders.purchase_order_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    item_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    unit_of_measure: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # ---------------------------------------------------------
    # TAX
    # ---------------------------------------------------------

    tax_code_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "procurement.tax_codes.tax_code_id"
        ),
        nullable=True,
        index=True,
    )

    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(7, 4),
        nullable=False,
        default=Decimal("0.0000"),
    )

    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    line_total: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ---------------------------------------------------------
    # RELATIONSHIPS
    # ---------------------------------------------------------

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="items",
    )