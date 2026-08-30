from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GoodsReceiptItemCreate(BaseModel):
    purchase_order_item_id: int
    item_code: str | None = Field(
        default=None,
        max_length=50,
    )
    description: str = Field(
        min_length=2,
    )
    ordered_quantity: float = Field(
        ge=0,
    )
    received_quantity: float = Field(
        ge=0,
    )
    rejected_quantity: float = Field(
        default=0,
        ge=0,
    )
    unit_of_measure: str = Field(
        min_length=1,
        max_length=30,
    )
    notes: str | None = None


class GoodsReceiptItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    goods_receipt_item_id: int
    goods_receipt_id: int
    purchase_order_item_id: int
    item_code: str | None
    description: str
    ordered_quantity: float
    received_quantity: float
    rejected_quantity: float
    unit_of_measure: str
    notes: str | None


class GoodsReceiptCreate(BaseModel):
    purchase_order_id: int
    received_by_user_id: int
    delivery_reference: str | None = Field(
        default=None,
        max_length=100,
    )
    notes: str | None = None
    items: list[GoodsReceiptItemCreate]


class GoodsReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    goods_receipt_id: int
    receipt_number: str
    purchase_order_id: int
    received_by_user_id: int
    status: str
    delivery_reference: str | None
    notes: str | None
    received_at: datetime
    created_at: datetime
    items: list[GoodsReceiptItemResponse]