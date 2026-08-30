from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.warehouse import Warehouse, WarehouseLocation
from app.schemas.warehouse import (
    LOCATION_TYPES,
    WAREHOUSE_TYPES,
    WarehouseCreate,
    WarehouseLocationCreate,
    WarehouseLocationUpdate,
    WarehouseUpdate,
)


def _normalise(value: str) -> str:
    return value.strip().upper()


def _validate_warehouse_type(value: str) -> str:
    normalised = _normalise(value)
    if normalised not in WAREHOUSE_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid warehouse type: {normalised}.")
    return normalised


def _validate_location_type(value: str) -> str:
    normalised = _normalise(value)
    if normalised not in LOCATION_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid warehouse location type: {normalised}.")
    return normalised


def list_warehouses(db: Session) -> list[Warehouse]:
    return list(db.scalars(select(Warehouse).order_by(Warehouse.warehouse_code)).all())


def get_warehouse(db: Session, warehouse_id: int) -> Warehouse:
    statement = (
        select(Warehouse)
        .options(selectinload(Warehouse.locations))
        .where(Warehouse.warehouse_id == warehouse_id)
    )
    warehouse = db.scalar(statement)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found.")
    return warehouse


def create_warehouse(db: Session, payload: WarehouseCreate) -> Warehouse:
    warehouse_code = _normalise(payload.warehouse_code)
    if db.scalar(select(Warehouse).where(Warehouse.warehouse_code == warehouse_code)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Warehouse code already exists.")

    warehouse = Warehouse(
        warehouse_code=warehouse_code,
        warehouse_name=payload.warehouse_name.strip(),
        warehouse_type=_validate_warehouse_type(payload.warehouse_type),
        address=payload.address.strip() if payload.address else None,
        city=payload.city.strip() if payload.city else None,
        state=payload.state.strip() if payload.state else None,
        postcode=payload.postcode.strip() if payload.postcode else None,
        country=payload.country.strip(),
        is_active=payload.is_active,
        created_by=payload.created_by,
        updated_by=payload.updated_by,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


def update_warehouse(db: Session, warehouse_id: int, payload: WarehouseUpdate) -> Warehouse:
    warehouse = get_warehouse(db, warehouse_id)
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("warehouse_type") is not None:
        update_data["warehouse_type"] = _validate_warehouse_type(update_data["warehouse_type"])
    for field in ("warehouse_name", "address", "city", "state", "postcode", "country"):
        if field in update_data and isinstance(update_data[field], str):
            update_data[field] = update_data[field].strip()
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    warehouse.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(warehouse)
    return warehouse


def list_locations(db: Session, warehouse_id: int, active_only: bool = False) -> list[WarehouseLocation]:
    get_warehouse(db, warehouse_id)
    statement = select(WarehouseLocation).where(WarehouseLocation.warehouse_id == warehouse_id)
    if active_only:
        statement = statement.where(WarehouseLocation.is_active.is_(True))
    return list(db.scalars(statement.order_by(WarehouseLocation.location_code)).all())


def create_location(db: Session, warehouse_id: int, payload: WarehouseLocationCreate) -> WarehouseLocation:
    warehouse = get_warehouse(db, warehouse_id)
    if not warehouse.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add a location to an inactive warehouse.")

    location_code = _normalise(payload.location_code)
    existing = db.scalar(select(WarehouseLocation).where(
        WarehouseLocation.warehouse_id == warehouse_id,
        WarehouseLocation.location_code == location_code,
    ))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Location code already exists in this warehouse.")

    location_type = _validate_location_type(payload.location_type)
    if payload.is_quarantine_location and location_type != "QUARANTINE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A quarantine location must use location type QUARANTINE.")
    if payload.is_receiving_location and location_type != "RECEIVING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A receiving location must use location type RECEIVING.")

    location = WarehouseLocation(
        warehouse_id=warehouse_id,
        location_code=location_code,
        location_name=payload.location_name.strip(),
        location_type=location_type,
        aisle=payload.aisle.strip() if payload.aisle else None,
        rack=payload.rack.strip() if payload.rack else None,
        bin=payload.bin.strip() if payload.bin else None,
        is_receiving_location=payload.is_receiving_location,
        is_quarantine_location=payload.is_quarantine_location,
        is_active=payload.is_active,
        created_by=payload.created_by,
        updated_by=payload.updated_by,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def update_location(db: Session, location_id: int, payload: WarehouseLocationUpdate) -> WarehouseLocation:
    location = db.get(WarehouseLocation, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse location not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("location_type") is not None:
        update_data["location_type"] = _validate_location_type(update_data["location_type"])

    resulting_type = update_data.get("location_type", location.location_type)
    resulting_quarantine = update_data.get("is_quarantine_location", location.is_quarantine_location)
    resulting_receiving = update_data.get("is_receiving_location", location.is_receiving_location)
    if resulting_quarantine and resulting_type != "QUARANTINE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A quarantine location must use location type QUARANTINE.")
    if resulting_receiving and resulting_type != "RECEIVING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A receiving location must use location type RECEIVING.")

    for field in ("location_name", "aisle", "rack", "bin"):
        if field in update_data and isinstance(update_data[field], str):
            update_data[field] = update_data[field].strip()
    for field, value in update_data.items():
        setattr(location, field, value)
    location.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(location)
    return location
