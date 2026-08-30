from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ============================================================
# PURCHASE ORDER ITEM CREATE
# ============================================================

class PurchaseOrderItemCreate(BaseModel):
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

    unit_price: float = Field(
        ge=0,
    )

    # Tax code is selected by the client.
    # Tax rate + tax amount are calculated by the backend.
    tax_code_id: int

    notes: str | None = None


# ============================================================
# PURCHASE ORDER ITEM RESPONSE
# ============================================================

class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    purchase_order_item_id: int
    purchase_order_id: int

    item_code: str | None
    description: str

    quantity: float
    unit_of_measure: str
    unit_price: float

    tax_code_id: int | None
    tax_rate: float
    tax_amount: float

    line_total: float

    notes: str | None


# ============================================================
# CREATE PURCHASE ORDER
# ============================================================

class PurchaseOrderCreate(BaseModel):
    supplier_id: int

    purchase_request_id: int | None = None

    created_by_user_id: int

    # --------------------------------------------------------
    # WAREHOUSE DESTINATION
    # --------------------------------------------------------

    warehouse_id: int | None = None

    receiving_location_id: int | None = None

    # --------------------------------------------------------
    # TRANSACTION CURRENCY
    # --------------------------------------------------------

    currency: str = Field(
        default="AUD",
        min_length=3,
        max_length=3,
    )

    # Exchange rate is NOT sent by the frontend.
    #
    # The backend will:
    # - use 1.0 for AUD
    # - retrieve the applicable rate for foreign currency

    # --------------------------------------------------------
    # DELIVERY
    # --------------------------------------------------------

    delivery_address: str | None = None

    notes: str | None = None

    expected_delivery_date: datetime | None = None

    # --------------------------------------------------------
    # LINES
    # --------------------------------------------------------

    items: list[
        PurchaseOrderItemCreate
    ]


# ============================================================
# UPDATE PURCHASE ORDER
# ============================================================

class PurchaseOrderUpdate(BaseModel):
    supplier_id: int | None = None

    # --------------------------------------------------------
    # WAREHOUSE DESTINATION
    # --------------------------------------------------------

    warehouse_id: int | None = None

    receiving_location_id: int | None = None

    # --------------------------------------------------------
    # COMMERCIAL DETAILS
    # --------------------------------------------------------

    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    delivery_address: str | None = None

    notes: str | None = None

    expected_delivery_date: datetime | None = None

    status: str | None = Field(
        default=None,
        max_length=30,
    )


# ============================================================
# RESPONSE
# ============================================================

class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    purchase_order_id: int

    po_number: str

    supplier_id: int

    purchase_request_id: int | None

    created_by_user_id: int

    # --------------------------------------------------------
    # WAREHOUSE DESTINATION
    # --------------------------------------------------------

    warehouse_id: int | None

    receiving_location_id: int | None

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    status: str

    # --------------------------------------------------------
    # TRANSACTION CURRENCY
    # --------------------------------------------------------

    currency: str

    subtotal: float

    tax_amount: float

    total_amount: float

    # --------------------------------------------------------
    # BASE CURRENCY / EXCHANGE RATE
    # --------------------------------------------------------

    base_currency: str

    exchange_rate: float

    base_subtotal: float | None

    base_tax_amount: float | None

    base_total_amount: float | None

    # --------------------------------------------------------
    # DELIVERY
    # --------------------------------------------------------

    delivery_address: str | None

    notes: str | None

    expected_delivery_date: datetime | None

    # --------------------------------------------------------
    # AUDIT
    # --------------------------------------------------------

    created_at: datetime

    updated_at: datetime

    # --------------------------------------------------------
    # LINES
    # --------------------------------------------------------

    items: list[
        PurchaseOrderItemResponse
    ]