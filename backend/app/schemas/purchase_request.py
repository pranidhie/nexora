from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PurchaseRequestItemCreate(BaseModel):
    item_code: str | None = Field(
        default=None,
        max_length=50,
    )
    description: str = Field(
        min_length=2,
    )
    quantity: float = Field(
        gt=0,
    )
    unit_of_measure: str = Field(
        min_length=1,
        max_length=30,
    )
    estimated_unit_price: float = Field(
        ge=0,
    )
    notes: str | None = None


class PurchaseRequestItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_request_item_id: int
    purchase_request_id: int
    item_code: str | None
    description: str
    quantity: float
    unit_of_measure: str
    estimated_unit_price: float
    estimated_total: float
    notes: str | None


class PurchaseRequestCreate(BaseModel):
    requested_by_user_id: int
    department: str = Field(
        min_length=2,
        max_length=100,
    )
    purpose: str = Field(
        min_length=2,
    )
    priority: str = Field(
        default="NORMAL",
        max_length=20,
    )
    required_by_date: datetime | None = None
    items: list[PurchaseRequestItemCreate]


class PurchaseRequestUpdate(BaseModel):
    department: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    purpose: str | None = Field(
        default=None,
        min_length=2,
    )
    priority: str | None = Field(
        default=None,
        max_length=20,
    )
    required_by_date: datetime | None = None
    status: str | None = Field(
        default=None,
        max_length=30,
    )


class PurchaseRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_request_id: int
    request_number: str
    requested_by_user_id: int
    department: str
    purpose: str
    priority: str
    status: str
    total_estimated_amount: float
    required_by_date: datetime | None
    created_at: datetime
    updated_at: datetime
    items: list[PurchaseRequestItemResponse]