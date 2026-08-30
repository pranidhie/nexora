from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseDetailsResponse, WarehouseLocationCreate,
    WarehouseLocationResponse, WarehouseLocationUpdate, WarehouseResponse,
    WarehouseUpdate,
)
from app.services.warehouse_service import (
    create_location, create_warehouse, get_warehouse, list_locations,
    list_warehouses, update_location, update_warehouse,
)

router = APIRouter(prefix="/api/v1/warehouses", tags=["Warehouses"])


@router.get("", response_model=list[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)) -> list[WarehouseResponse]:
    return list_warehouses(db)


@router.get("/{warehouse_id}", response_model=WarehouseDetailsResponse)
def get_warehouse_details(warehouse_id: int, db: Session = Depends(get_db)) -> WarehouseDetailsResponse:
    return get_warehouse(db, warehouse_id)


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def add_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db)) -> WarehouseResponse:
    return create_warehouse(db, payload)


@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def edit_warehouse(warehouse_id: int, payload: WarehouseUpdate, db: Session = Depends(get_db)) -> WarehouseResponse:
    return update_warehouse(db, warehouse_id, payload)


@router.get("/{warehouse_id}/locations", response_model=list[WarehouseLocationResponse])
def get_warehouse_locations(warehouse_id: int, active_only: bool = False, db: Session = Depends(get_db)) -> list[WarehouseLocationResponse]:
    return list_locations(db, warehouse_id, active_only=active_only)


@router.post("/{warehouse_id}/locations", response_model=WarehouseLocationResponse, status_code=status.HTTP_201_CREATED)
def add_warehouse_location(warehouse_id: int, payload: WarehouseLocationCreate, db: Session = Depends(get_db)) -> WarehouseLocationResponse:
    return create_location(db, warehouse_id, payload)


@router.patch("/locations/{location_id}", response_model=WarehouseLocationResponse)
def edit_warehouse_location(location_id: int, payload: WarehouseLocationUpdate, db: Session = Depends(get_db)) -> WarehouseLocationResponse:
    return update_location(db, location_id, payload)
