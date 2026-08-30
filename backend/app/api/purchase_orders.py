from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from app.services.purchase_order_service import (
    create_purchase_order,
    get_purchase_order_by_id,
    list_purchase_orders,
    update_purchase_order,
)

router = APIRouter(
    prefix="/api/v1/purchase-orders",
    tags=["Purchase Orders"],
)


@router.get(
    "",
    response_model=list[PurchaseOrderResponse],
)
def get_purchase_orders(
    db: Session = Depends(get_db),
) -> list[PurchaseOrderResponse]:
    return list_purchase_orders(db)


@router.get(
    "/{purchase_order_id}",
    response_model=PurchaseOrderResponse,
)
def get_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
) -> PurchaseOrderResponse:
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    return purchase_order


@router.post(
    "",
    response_model=PurchaseOrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_purchase_order(
    order_data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
) -> PurchaseOrderResponse:
    return create_purchase_order(
        db,
        order_data,
    )


@router.patch(
    "/{purchase_order_id}",
    response_model=PurchaseOrderResponse,
)
def edit_purchase_order(
    purchase_order_id: int,
    order_data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
) -> PurchaseOrderResponse:
    purchase_order = get_purchase_order_by_id(
        db,
        purchase_order_id,
    )

    if not purchase_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase order not found.",
        )

    return update_purchase_order(
        db,
        purchase_order,
        order_data,
    )