from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"
    __table_args__ = {"schema": "procurement"}

    goods_receipt_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    receipt_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    purchase_order_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.purchase_orders.purchase_order_id"
        ),
        nullable=False,
        index=True,
    )

    received_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("procurement.users.user_id"),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="RECEIVED",
    )

    delivery_reference: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    items = relationship(
        "GoodsReceiptItem",
        back_populates="goods_receipt",
        cascade="all, delete-orphan",
    )