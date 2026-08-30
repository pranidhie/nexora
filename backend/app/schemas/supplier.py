from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupplierBase(BaseModel):
    supplier_code: str = Field(
        min_length=2,
        max_length=30,
    )
    supplier_name: str = Field(
        min_length=2,
        max_length=150,
    )
    contact_name: str | None = Field(
        default=None,
        max_length=100,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=50,
    )
    address: str | None = Field(
        default=None,
        max_length=255,
    )
    payment_terms: str | None = Field(
        default=None,
        max_length=50,
    )


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    contact_name: str | None = Field(
        default=None,
        max_length=100,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=50,
    )
    address: str | None = Field(
        default=None,
        max_length=255,
    )
    payment_terms: str | None = Field(
        default=None,
        max_length=50,
    )
    is_active: bool | None = None


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime