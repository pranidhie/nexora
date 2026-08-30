from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.goods_receipt import (
    GoodsReceiptCreate,
    GoodsReceiptResponse,
)
from app.services.goods_receipt_service import (
    create_goods_receipt,
    get_goods_receipt_by_id,
    list_goods_receipts,
)

router = APIRouter(
    prefix="/api/v1/goods-receipts",
    tags=["Goods Receipts"],
)


@router.get(
    "",
    response_model=list[GoodsReceiptResponse],
)
def get_goods_receipts(
    db: Session = Depends(get_db),
) -> list[GoodsReceiptResponse]:
    return list_goods_receipts(db)


@router.get(
    "/{goods_receipt_id}",
    response_model=GoodsReceiptResponse,
)
def get_goods_receipt(
    goods_receipt_id: int,
    db: Session = Depends(get_db),
) -> GoodsReceiptResponse:
    goods_receipt = get_goods_receipt_by_id(
        db,
        goods_receipt_id,
    )

    if not goods_receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goods receipt not found.",
        )

    return goods_receipt


@router.post(
    "",
    response_model=GoodsReceiptResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_goods_receipt(
    receipt_data: GoodsReceiptCreate,
    db: Session = Depends(get_db),
) -> GoodsReceiptResponse:
    try:
        return create_goods_receipt(
            db,
            receipt_data,
        )
    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error