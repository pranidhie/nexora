from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

WAREHOUSE_TYPES = {"RAW_MATERIAL", "FINISHED_GOODS", "QUARANTINE", "GENERAL"}
LOCATION_TYPES = {"STORAGE", "RECEIVING", "QUARANTINE", "DISPATCH"}


class WarehouseCreate(BaseModel):
    warehouse_code: str = Field(min_length=2, max_length=30)
    warehouse_name: str = Field(min_length=2, max_length=150)
    warehouse_type: str = Field(min_length=2, max_length=30)
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postcode: str | None = Field(default=None, max_length=20)
    country: str = Field(default="Australia", min_length=2, max_length=100)
    is_active: bool = True
    created_by: int
    updated_by: int


class WarehouseUpdate(BaseModel):
    warehouse_name: str | None = Field(default=None, min_length=2, max_length=150)
    warehouse_type: str | None = Field(default=None, min_length=2, max_length=30)
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postcode: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, min_length=2, max_length=100)
    is_active: bool | None = None
    updated_by: int


class WarehouseLocationCreate(BaseModel):
    location_code: str = Field(min_length=1, max_length=40)
    location_name: str = Field(min_length=2, max_length=150)
    location_type: str = Field(min_length=2, max_length=30)
    aisle: str | None = Field(default=None, max_length=30)
    rack: str | None = Field(default=None, max_length=30)
    bin: str | None = Field(default=None, max_length=30)
    is_receiving_location: bool = False
    is_quarantine_location: bool = False
    is_active: bool = True
    created_by: int
    updated_by: int


class WarehouseLocationUpdate(BaseModel):
    location_name: str | None = Field(default=None, min_length=2, max_length=150)
    location_type: str | None = Field(default=None, min_length=2, max_length=30)
    aisle: str | None = Field(default=None, max_length=30)
    rack: str | None = Field(default=None, max_length=30)
    bin: str | None = Field(default=None, max_length=30)
    is_receiving_location: bool | None = None
    is_quarantine_location: bool | None = None
    is_active: bool | None = None
    updated_by: int


class WarehouseLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    warehouse_location_id: int
    warehouse_id: int
    location_code: str
    location_name: str
    location_type: str
    aisle: str | None
    rack: str | None
    bin: str | None
    is_receiving_location: bool
    is_quarantine_location: bool
    is_active: bool
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int


class WarehouseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    warehouse_id: int
    warehouse_code: str
    warehouse_name: str
    warehouse_type: str
    address: str | None
    city: str | None
    state: str | None
    postcode: str | None
    country: str
    is_active: bool
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int


class WarehouseDetailsResponse(WarehouseResponse):
    locations: list[WarehouseLocationResponse] = []
