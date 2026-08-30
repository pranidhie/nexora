from datetime import datetime
from decimal import Decimal
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base

class InventoryBalance(Base):
    __tablename__ = 'inventory_balances'
    __table_args__ = (UniqueConstraint('catalogue_item_id', name='uq_inventory_balance_item'), {'schema': 'procurement'})

    inventory_balance_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    catalogue_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('procurement.catalogue_items.catalogue_item_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, index=True)
    unit_of_measure: Mapped[str] = mapped_column(String(30), nullable=False)
    on_hand_quantity: Mapped[Decimal] = mapped_column(Numeric(18,4), nullable=False, default=Decimal('0'))
    available_quantity: Mapped[Decimal] = mapped_column(Numeric(18,4), nullable=False, default=Decimal('0'))
    quarantine_quantity: Mapped[Decimal] = mapped_column(Numeric(18,4), nullable=False, default=Decimal('0'))
    last_transaction_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class InventoryTransaction(Base):
    __tablename__ = 'inventory_transactions'
    __table_args__ = (UniqueConstraint('source_document_type','source_document_id','source_line_id','transaction_type', name='uq_inventory_transaction_source_line'), {'schema': 'procurement'})

    inventory_transaction_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    catalogue_item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('procurement.catalogue_items.catalogue_item_id', onupdate='CASCADE', ondelete='RESTRICT'), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18,4), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(30), nullable=False)
    source_document_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source_document_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source_line_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
