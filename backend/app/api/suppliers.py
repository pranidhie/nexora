from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.services.supplier_service import (
    create_supplier,
    get_supplier_by_id,
    list_suppliers,
    update_supplier,
)

router = APIRouter(
    prefix="/api/v1/suppliers",
    tags=["Suppliers"],
)


@router.get(
    "",
    response_model=list[SupplierResponse],
)
def get_suppliers(
    db: Session = Depends(get_db),
) -> list[SupplierResponse]:
    return list_suppliers(db)


@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
) -> SupplierResponse:
    supplier = get_supplier_by_id(
        db,
        supplier_id,
    )

    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    return supplier


@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
) -> SupplierResponse:
    try:
        return create_supplier(
            db,
            supplier_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error


@router.patch(
    "/{supplier_id}",
    response_model=SupplierResponse,
)
def edit_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
) -> SupplierResponse:
    supplier = get_supplier_by_id(
        db,
        supplier_id,
    )

    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    return update_supplier(
        db,
        supplier,
        supplier_data,
    )