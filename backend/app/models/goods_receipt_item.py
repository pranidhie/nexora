from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GoodsReceiptItem(Base):
    __tablename__ = "goods_receipt_items"
    __table_args__ = {"schema": "procurement"}

    goods_receipt_item_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    goods_receipt_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.goods_receipts.goods_receipt_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    purchase_order_item_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.purchase_order_items.purchase_order_item_id"
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

    ordered_quantity: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    received_quantity: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    rejected_quantity: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    unit_of_measure: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    goods_receipt = relationship(
        "GoodsReceipt",
        back_populates="items",
    )