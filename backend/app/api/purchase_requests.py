from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.purchase_request import (
    PurchaseRequestCreate,
    PurchaseRequestResponse,
    PurchaseRequestUpdate,
)
from app.services.purchase_request_service import (
    create_purchase_request,
    get_purchase_request_by_id,
    list_purchase_requests,
    update_purchase_request,
)

router = APIRouter(
    prefix="/api/v1/purchase-requests",
    tags=["Purchase Requests"],
)


@router.get(
    "",
    response_model=list[PurchaseRequestResponse],
)
def get_purchase_requests(
    db: Session = Depends(get_db),
) -> list[PurchaseRequestResponse]:
    return list_purchase_requests(db)


@router.get(
    "/{purchase_request_id}",
    response_model=PurchaseRequestResponse,
)
def get_purchase_request(
    purchase_request_id: int,
    db: Session = Depends(get_db),
) -> PurchaseRequestResponse:
    purchase_request = get_purchase_request_by_id(
        db,
        purchase_request_id,
    )

    if not purchase_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase request not found.",
        )

    return purchase_request


@router.post(
    "",
    response_model=PurchaseRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_purchase_request(
    request_data: PurchaseRequestCreate,
    db: Session = Depends(get_db),
) -> PurchaseRequestResponse:
    return create_purchase_request(
        db,
        request_data,
    )


@router.patch(
    "/{purchase_request_id}",
    response_model=PurchaseRequestResponse,
)
def edit_purchase_request(
    purchase_request_id: int,
    request_data: PurchaseRequestUpdate,
    db: Session = Depends(get_db),
) -> PurchaseRequestResponse:
    purchase_request = get_purchase_request_by_id(
        db,
        purchase_request_id,
    )

    if not purchase_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase request not found.",
        )

    return update_purchase_request(
        db,
        purchase_request,
        request_data,
    )