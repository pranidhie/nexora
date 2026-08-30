from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Warehouse(Base):
    __tablename__ = "warehouses"
    __table_args__ = {
        "schema": "procurement",
    }

    warehouse_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    warehouse_code: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        unique=True,
    )

    warehouse_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    warehouse_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    address: Mapped[str | None] = mapped_column(
        String(300),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    postcode: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Australia",
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

    created_by: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    updated_by: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    locations: Mapped[list["WarehouseLocation"]] = relationship(
        back_populates="warehouse",
        cascade="all, delete-orphan",
    )


class WarehouseLocation(Base):
    __tablename__ = "warehouse_locations"

    __table_args__ = (
        UniqueConstraint(
            "warehouse_id",
            "location_code",
            name="uq_warehouse_location_code",
        ),
        {
            "schema": "procurement",
        },
    )

    warehouse_location_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    warehouse_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.warehouses.warehouse_id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    location_code: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    location_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    location_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    aisle: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    rack: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    bin: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    is_receiving_location: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_quarantine_location: Mapped[bool] = mapped_column(
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

    created_by: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    updated_by: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    warehouse: Mapped["Warehouse"] = relationship(
        back_populates="locations",
    )