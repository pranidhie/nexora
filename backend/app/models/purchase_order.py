from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
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

from sqlalchemy.sql import func

from app.db.base import Base


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    __table_args__ = {
        "schema": "procurement",
    }

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    purchase_order_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    po_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    # ========================================================
    # SUPPLIER / SOURCE
    # ========================================================

    supplier_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.suppliers.supplier_id"
        ),
        nullable=False,
        index=True,
    )

    purchase_request_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "procurement.purchase_requests."
            "purchase_request_id"
        ),
        nullable=True,
        index=True,
    )

    created_by_user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.users.user_id"
        ),
        nullable=False,
    )

    # ========================================================
    # WAREHOUSE DESTINATION
    # ========================================================

    warehouse_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "procurement.warehouses.warehouse_id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    receiving_location_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "procurement.warehouse_locations."
            "warehouse_location_id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    # ========================================================
    # STATUS
    # ========================================================

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="DRAFT",
    )

    # ========================================================
    # TRANSACTION CURRENCY
    # ========================================================

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="AUD",
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    # ========================================================
    # BASE CURRENCY / EXCHANGE RATE
    # ========================================================

    base_currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="AUD",
    )

    exchange_rate: Mapped[Decimal] = mapped_column(
        Numeric(18, 8),
        nullable=False,
        default=Decimal("1.00000000"),
    )

    base_subtotal: Mapped[
        Decimal | None
    ] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    base_tax_amount: Mapped[
        Decimal | None
    ] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    base_total_amount: Mapped[
        Decimal | None
    ] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    # ========================================================
    # DELIVERY
    # ========================================================

    delivery_address: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    expected_delivery_date: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ========================================================
    # AUDIT
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan",
    )

    warehouse = relationship(
        "Warehouse",
        foreign_keys=[
            warehouse_id,
        ],
    )

    receiving_location = relationship(
        "WarehouseLocation",
        foreign_keys=[
            receiving_location_id,
        ],
    )