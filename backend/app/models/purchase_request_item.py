from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PurchaseRequestItem(Base):
    __tablename__ = "purchase_request_items"
    __table_args__ = {"schema": "procurement"}

    purchase_request_item_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    purchase_request_id: Mapped[int] = mapped_column(
        ForeignKey(
            "procurement.purchase_requests.purchase_request_id",
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

    quantity: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    unit_of_measure: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    estimated_unit_price: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    estimated_total: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    purchase_request = relationship(
        "PurchaseRequest",
        back_populates="items",
    )