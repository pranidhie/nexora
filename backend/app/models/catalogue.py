from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ItemCategory(Base):
    __tablename__ = "item_categories"
    __table_args__ = (
        Index(
            "idx_item_categories_active",
            "active",
        ),
        {
            "schema": "procurement",
        },
    )

    category_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    category_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    category_name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    catalogue_items: Mapped[list["CatalogueItem"]] = relationship(
        back_populates="category",
    )


class UnitOfMeasure(Base):
    __tablename__ = "units_of_measure"
    __table_args__ = (
        CheckConstraint(
            """
            uom_type IS NULL
            OR uom_type IN (
                'WEIGHT',
                'VOLUME',
                'COUNT',
                'PACKAGING'
            )
            """,
            name="chk_units_of_measure_type",
        ),
        Index(
            "idx_units_of_measure_active",
            "active",
        ),
        Index(
            "idx_units_of_measure_type",
            "uom_type",
        ),
        {
            "schema": "procurement",
        },
    )

    uom_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    uom_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    uom_name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    uom_type: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class CatalogueItem(Base):
    __tablename__ = "catalogue_items"
    __table_args__ = (
        CheckConstraint(
            """
            item_type IN (
                'RAW_MATERIAL',
                'INGREDIENT',
                'PACKAGING_MATERIAL',
                'CLEANING_MATERIAL',
                'MAINTENANCE_ITEM',
                'NON_STOCK_ITEM',
                'SERVICE'
            )
            """,
            name="chk_catalogue_items_type",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'INACTIVE')",
            name="chk_catalogue_items_status",
        ),
        CheckConstraint(
            """
            conversion_factor IS NULL
            OR conversion_factor > 0
            """,
            name="chk_catalogue_items_conversion_factor",
        ),
        CheckConstraint(
            """
            shelf_life_days IS NULL
            OR shelf_life_days >= 0
            """,
            name="chk_catalogue_items_shelf_life",
        ),
        Index(
            "idx_catalogue_items_name",
            "item_name",
        ),
        Index(
            "idx_catalogue_items_type",
            "item_type",
        ),
        Index(
            "idx_catalogue_items_category",
            "category_id",
        ),
        Index(
            "idx_catalogue_items_status",
            "status",
        ),
        Index(
            "idx_catalogue_items_batch_tracking",
            "batch_tracking_required",
        ),
        Index(
            "idx_catalogue_items_expiry_tracking",
            "expiry_tracking_required",
        ),
        {
            "schema": "procurement",
        },
    )

    catalogue_item_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    item_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    item_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    item_type: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    category_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.item_categories.category_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    purchase_uom_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.units_of_measure.uom_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    stock_uom_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.units_of_measure.uom_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=True,
    )

    conversion_factor: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
        nullable=True,
    )

    shelf_life_days: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    storage_condition: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    batch_tracking_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    expiry_tracking_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    allergen_information: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    country_of_origin: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_by: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_by: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    category: Mapped[ItemCategory] = relationship(
        back_populates="catalogue_items",
    )

    purchase_uom: Mapped[UnitOfMeasure] = relationship(
        foreign_keys=[purchase_uom_id],
    )

    stock_uom: Mapped[UnitOfMeasure | None] = relationship(
        foreign_keys=[stock_uom_id],
    )

    supplier_items: Mapped[list["SupplierItem"]] = relationship(
        back_populates="catalogue_item",
        cascade="all, delete-orphan",
    )


class SupplierItem(Base):
    __tablename__ = "supplier_items"
    __table_args__ = (
        CheckConstraint(
            "unit_price >= 0",
            name="chk_supplier_items_unit_price",
        ),
        CheckConstraint(
            """
            minimum_order_quantity IS NULL
            OR minimum_order_quantity > 0
            """,
            name="chk_supplier_items_minimum_order_quantity",
        ),
        CheckConstraint(
            """
            lead_time_days IS NULL
            OR lead_time_days >= 0
            """,
            name="chk_supplier_items_lead_time",
        ),
        CheckConstraint(
            """
            effective_to IS NULL
            OR effective_to >= effective_from
            """,
            name="chk_supplier_items_effective_dates",
        ),
        Index(
            "idx_supplier_items_supplier",
            "supplier_id",
        ),
        Index(
            "idx_supplier_items_catalogue_item",
            "catalogue_item_id",
        ),
        Index(
            "idx_supplier_items_supplier_code",
            "supplier_item_code",
        ),
        Index(
            "idx_supplier_items_active",
            "active",
        ),
        Index(
            "idx_supplier_items_preferred",
            "preferred_supplier",
        ),
        Index(
            "idx_supplier_items_lookup",
            "supplier_id",
            "catalogue_item_id",
            "effective_from",
        ),
        {
            "schema": "procurement",
        },
    )

    supplier_item_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    supplier_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.suppliers.supplier_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    catalogue_item_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.catalogue_items.catalogue_item_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    supplier_item_code: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    purchase_uom_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.units_of_measure.uom_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
    )

    currency_code: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="AUD",
    )

    minimum_order_quantity: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 4),
        nullable=True,
    )

    lead_time_days: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    preferred_supplier: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_by: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_by: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    catalogue_item: Mapped[CatalogueItem] = relationship(
        back_populates="supplier_items",
    )

    purchase_uom: Mapped[UnitOfMeasure] = relationship()