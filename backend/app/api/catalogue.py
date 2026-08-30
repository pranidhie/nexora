from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.schemas.catalogue import (
    CatalogueItemCreate,
    CatalogueItemResponse,
    CatalogueItemUpdate,
    ItemCategoryResponse,
    SupplierItemCreate,
    SupplierItemResponse,
    SupplierItemUpdate,
    UnitOfMeasureResponse,
)

from app.services.catalogue_service import (
    create_catalogue_item,
    create_supplier_item,
    get_catalogue_item,
    get_catalogue_items,
    get_item_categories,
    get_supplier_items_for_catalogue_item,
    get_units_of_measure,
    update_catalogue_item,
    update_supplier_item,
)


router = APIRouter(
    prefix="/api/v1/catalogue",
    tags=["Catalogue"],
)


@router.get(
    "/categories",
    response_model=list[ItemCategoryResponse],
)
def list_item_categories(
    db: Session = Depends(get_db),
) -> list[ItemCategoryResponse]:
    return get_item_categories(db)


@router.get(
    "/uoms",
    response_model=list[UnitOfMeasureResponse],
)
def list_units_of_measure(
    db: Session = Depends(get_db),
) -> list[UnitOfMeasureResponse]:
    return get_units_of_measure(db)


@router.get(
    "/items",
    response_model=list[CatalogueItemResponse],
)
def list_catalogue_items(
    db: Session = Depends(get_db),
) -> list[CatalogueItemResponse]:
    return get_catalogue_items(db)


@router.get(
    "/items/{catalogue_item_id}",
    response_model=CatalogueItemResponse,
)
def read_catalogue_item(
    catalogue_item_id: int,
    db: Session = Depends(get_db),
) -> CatalogueItemResponse:
    return get_catalogue_item(
        db,
        catalogue_item_id,
    )


@router.post(
    "/items",
    response_model=CatalogueItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_catalogue_item(
    payload: CatalogueItemCreate,
    db: Session = Depends(get_db),
) -> CatalogueItemResponse:
    return create_catalogue_item(
        db,
        payload,
    )


@router.patch(
    "/items/{catalogue_item_id}",
    response_model=CatalogueItemResponse,
)
def edit_catalogue_item(
    catalogue_item_id: int,
    payload: CatalogueItemUpdate,
    db: Session = Depends(get_db),
) -> CatalogueItemResponse:
    return update_catalogue_item(
        db,
        catalogue_item_id,
        payload,
    )


@router.get(
    "/items/{catalogue_item_id}/suppliers",
    response_model=list[SupplierItemResponse],
)
def list_catalogue_item_suppliers(
    catalogue_item_id: int,
    db: Session = Depends(get_db),
) -> list[SupplierItemResponse]:
    return get_supplier_items_for_catalogue_item(
        db,
        catalogue_item_id,
    )


@router.post(
    "/items/{catalogue_item_id}/suppliers",
    response_model=SupplierItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_supplier_to_catalogue_item(
    catalogue_item_id: int,
    payload: SupplierItemCreate,
    db: Session = Depends(get_db),
) -> SupplierItemResponse:
    payload.catalogue_item_id = catalogue_item_id

    return create_supplier_item(
        db,
        payload,
    )


@router.patch(
    "/supplier-items/{supplier_item_id}",
    response_model=SupplierItemResponse,
)
def edit_supplier_item(
    supplier_item_id: int,
    payload: SupplierItemUpdate,
    db: Session = Depends(get_db),
) -> SupplierItemResponse:
    return update_supplier_item(
        db,
        supplier_item_id,
        payload,
    )