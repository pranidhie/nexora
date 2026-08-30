from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def get_supplier_by_code(
    db: Session,
    supplier_code: str,
) -> Supplier | None:
    normalized_code = supplier_code.strip().upper()

    return db.scalar(
        select(Supplier).where(
            Supplier.supplier_code == normalized_code
        )
    )


def get_supplier_by_id(
    db: Session,
    supplier_id: int,
) -> Supplier | None:
    return db.get(
        Supplier,
        supplier_id,
    )


def list_suppliers(
    db: Session,
) -> list[Supplier]:
    return list(
        db.scalars(
            select(Supplier).order_by(
                Supplier.supplier_name
            )
        ).all()
    )


def create_supplier(
    db: Session,
    supplier_data: SupplierCreate,
) -> Supplier:
    normalized_code = (
        supplier_data.supplier_code
        .strip()
        .upper()
    )

    existing_supplier = get_supplier_by_code(
        db,
        normalized_code,
    )

    if existing_supplier:
        raise ValueError(
            "Supplier code already exists."
        )

    supplier = Supplier(
        supplier_code=normalized_code,
        supplier_name=(
            supplier_data.supplier_name
            .strip()
        ),
        contact_name=(
            supplier_data.contact_name.strip()
            if supplier_data.contact_name
            else None
        ),
        email=(
            str(supplier_data.email).lower()
            if supplier_data.email
            else None
        ),
        phone=(
            supplier_data.phone.strip()
            if supplier_data.phone
            else None
        ),
        address=(
            supplier_data.address.strip()
            if supplier_data.address
            else None
        ),
        payment_terms=(
            supplier_data.payment_terms.strip()
            if supplier_data.payment_terms
            else None
        ),
        is_active=True,
    )

    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier


def update_supplier(
    db: Session,
    supplier: Supplier,
    supplier_data: SupplierUpdate,
) -> Supplier:
    update_data = supplier_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        if field == "email" and value:
            value = str(value).lower()

        setattr(
            supplier,
            field,
            value,
        )

    db.commit()
    db.refresh(supplier)

    return supplier