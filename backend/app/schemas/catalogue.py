from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ItemCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    category_code: str
    category_name: str
    description: str | None = None
    active: bool
    created_at: datetime
    updated_at: datetime


class UnitOfMeasureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uom_id: int
    uom_code: str
    uom_name: str
    uom_type: str | None = None
    active: bool
    created_at: datetime
    updated_at: datetime


class CatalogueItemCreate(BaseModel):
    item_code: str = Field(min_length=2, max_length=50)
    item_name: str = Field(min_length=2, max_length=200)
    item_type: str
    category_id: int
    purchase_uom_id: int
    stock_uom_id: int | None = None
    conversion_factor: Decimal | None = Field(default=None, gt=0)
    shelf_life_days: int | None = Field(default=None, ge=0)
    storage_condition: str | None = Field(default=None, max_length=200)
    batch_tracking_required: bool = False
    expiry_tracking_required: bool = False
    allergen_information: str | None = None
    country_of_origin: str | None = Field(default=None, max_length=100)
    created_by: int
    updated_by: int


class CatalogueItemUpdate(BaseModel):
    item_name: str | None = Field(default=None, min_length=2, max_length=200)
    item_type: str | None = None
    category_id: int | None = None
    purchase_uom_id: int | None = None
    stock_uom_id: int | None = None
    conversion_factor: Decimal | None = Field(default=None, gt=0)
    shelf_life_days: int | None = Field(default=None, ge=0)
    storage_condition: str | None = Field(default=None, max_length=200)
    batch_tracking_required: bool | None = None
    expiry_tracking_required: bool | None = None
    allergen_information: str | None = None
    country_of_origin: str | None = Field(default=None, max_length=100)
    status: str | None = None
    updated_by: int


class CatalogueItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    catalogue_item_id: int
    item_code: str
    item_name: str
    item_type: str
    category_id: int
    purchase_uom_id: int
    stock_uom_id: int | None = None
    conversion_factor: Decimal | None = None
    shelf_life_days: int | None = None
    storage_condition: str | None = None
    batch_tracking_required: bool
    expiry_tracking_required: bool
    allergen_information: str | None = None
    country_of_origin: str | None = None
    status: str
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int


class SupplierItemCreate(BaseModel):
    supplier_id: int
    catalogue_item_id: int | None = None
    supplier_item_code: str | None = Field(default=None, max_length=100)
    purchase_uom_id: int

    # An active purchasing relationship should not be created with a zero price.
    unit_price: Decimal = Field(gt=0)

    currency_code: str = Field(default="AUD", min_length=3, max_length=3)
    minimum_order_quantity: Decimal | None = Field(default=None, gt=0)
    lead_time_days: int | None = Field(default=None, ge=0)
    preferred_supplier: bool = False
    effective_from: date
    effective_to: date | None = None
    active: bool = True
    created_by: int
    updated_by: int


class SupplierItemUpdate(BaseModel):
    supplier_item_code: str | None = Field(default=None, max_length=100)
    purchase_uom_id: int | None = None

    # Same rule for pricing maintenance.
    unit_price: Decimal | None = Field(default=None, gt=0)

    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    minimum_order_quantity: Decimal | None = Field(default=None, gt=0)
    lead_time_days: int | None = Field(default=None, ge=0)
    preferred_supplier: bool | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    active: bool | None = None
    updated_by: int


class SupplierItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    supplier_item_id: int
    supplier_id: int
    catalogue_item_id: int
    supplier_item_code: str | None = None
    purchase_uom_id: int
    unit_price: Decimal
    currency_code: str
    minimum_order_quantity: Decimal | None = None
    lead_time_days: int | None = None
    preferred_supplier: bool
    effective_from: date
    effective_to: date | None = None
    active: bool
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int