from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalogue import (
    CatalogueItem,
    ItemCategory,
    SupplierItem,
    UnitOfMeasure,
)
from app.models.supplier import Supplier
from app.models.tax_currency import Currency
from app.schemas.catalogue import (
    CatalogueItemCreate,
    CatalogueItemUpdate,
    SupplierItemCreate,
    SupplierItemUpdate,
)
from app.core.procurement_rules import (
    bad_request,
    require_non_negative,
    require_positive,
    validate_effective_dates,
)


# ============================================================
# REFERENCE DATA
# ============================================================

def get_item_categories(
    db: Session,
) -> list[ItemCategory]:
    statement = (
        select(ItemCategory)
        .where(
            ItemCategory.active.is_(True)
        )
        .order_by(
            ItemCategory.category_name
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_units_of_measure(
    db: Session,
) -> list[UnitOfMeasure]:
    statement = (
        select(UnitOfMeasure)
        .where(
            UnitOfMeasure.active.is_(True)
        )
        .order_by(
            UnitOfMeasure.uom_code
        )
    )

    return list(
        db.scalars(statement).all()
    )


# ============================================================
# VALIDATION HELPERS
# ============================================================

def _validate_catalogue_measurements(
    *,
    conversion_factor: Decimal | float | None,
    shelf_life_days: int | None,
) -> None:
    if conversion_factor is not None:
        require_positive(
            conversion_factor,
            "Conversion factor",
        )

    if shelf_life_days is not None:
        require_non_negative(
            shelf_life_days,
            "Shelf life days",
        )


def _get_active_supplier(
    db: Session,
    supplier_id: int,
) -> Supplier:
    supplier = db.get(
        Supplier,
        supplier_id,
    )

    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found.",
        )

    if not supplier.is_active:
        raise bad_request(
            "Inactive suppliers cannot be linked "
            "to new catalogue pricing.",
        )

    return supplier


def _get_active_currency(
    db: Session,
    currency_code: str,
) -> Currency:
    code = currency_code.strip().upper()

    currency = db.scalar(
        select(Currency).where(
            Currency.currency_code == code,
        )
    )

    if currency is None:
        raise bad_request(
            f"Unknown currency code: {code}.",
        )

    if not currency.is_active:
        raise bad_request(
            f"Currency {code} is inactive.",
        )

    return currency


def _validate_supplier_pricing_values(
    *,
    unit_price: Decimal | float,
    minimum_order_quantity: Decimal | float | None,
    lead_time_days: int | None,
    effective_from,
    effective_to,
) -> None:
    require_positive(
        unit_price,
        "Supplier unit price",
    )

    if minimum_order_quantity is not None:
        require_positive(
            minimum_order_quantity,
            "Minimum order quantity",
        )

    if lead_time_days is not None:
        require_non_negative(
            lead_time_days,
            "Lead time days",
        )

    validate_effective_dates(
        effective_from,
        effective_to,
    )


# ============================================================
# CATALOGUE ITEMS
# ============================================================

def get_catalogue_items(
    db: Session,
) -> list[CatalogueItem]:
    statement = (
        select(CatalogueItem)
        .order_by(
            CatalogueItem.catalogue_item_id.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_catalogue_item(
    db: Session,
    catalogue_item_id: int,
) -> CatalogueItem:
    item = db.get(
        CatalogueItem,
        catalogue_item_id,
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catalogue item not found.",
        )

    return item


def get_active_catalogue_item(
    db: Session,
    catalogue_item_id: int,
) -> CatalogueItem:
    item = get_catalogue_item(
        db,
        catalogue_item_id,
    )

    if (
        item.status.strip().upper()
        != "ACTIVE"
    ):
        raise bad_request(
            "Inactive catalogue items cannot be used "
            "for new procurement transactions.",
        )

    return item


def create_catalogue_item(
    db: Session,
    payload: CatalogueItemCreate,
) -> CatalogueItem:
    item_code = (
        payload.item_code
        .strip()
        .upper()
    )

    item_name = (
        payload.item_name
        .strip()
    )

    if not item_code:
        raise bad_request(
            "Item code is required.",
        )

    if not item_name:
        raise bad_request(
            "Item name is required.",
        )

    existing_item = db.scalar(
        select(CatalogueItem).where(
            func.upper(
                CatalogueItem.item_code
            )
            == item_code,
        )
    )

    if existing_item is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item code already exists.",
        )

    category = db.get(
        ItemCategory,
        payload.category_id,
    )

    if (
        category is None
        or not category.active
    ):
        raise bad_request(
            "Invalid or inactive item category.",
        )

    purchase_uom = db.get(
        UnitOfMeasure,
        payload.purchase_uom_id,
    )

    if (
        purchase_uom is None
        or not purchase_uom.active
    ):
        raise bad_request(
            "Invalid or inactive purchase UOM.",
        )

    if payload.stock_uom_id is not None:
        stock_uom = db.get(
            UnitOfMeasure,
            payload.stock_uom_id,
        )

        if (
            stock_uom is None
            or not stock_uom.active
        ):
            raise bad_request(
                "Invalid or inactive stock UOM.",
            )

    _validate_catalogue_measurements(
        conversion_factor=(
            payload.conversion_factor
        ),
        shelf_life_days=(
            payload.shelf_life_days
        ),
    )

    now = datetime.now(
        timezone.utc
    )

    item = CatalogueItem(
        item_code=item_code,
        item_name=item_name,
        item_type=payload.item_type,
        category_id=payload.category_id,
        purchase_uom_id=(
            payload.purchase_uom_id
        ),
        stock_uom_id=(
            payload.stock_uom_id
        ),
        conversion_factor=(
            payload.conversion_factor
        ),
        shelf_life_days=(
            payload.shelf_life_days
        ),
        storage_condition=(
            payload.storage_condition
        ),
        batch_tracking_required=(
            payload.batch_tracking_required
        ),
        expiry_tracking_required=(
            payload.expiry_tracking_required
        ),
        allergen_information=(
            payload.allergen_information
        ),
        country_of_origin=(
            payload.country_of_origin
        ),
        status="ACTIVE",
        created_at=now,
        created_by=payload.created_by,
        updated_at=now,
        updated_by=payload.updated_by,
    )

    try:
        db.add(item)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(item)
    return item


def update_catalogue_item(
    db: Session,
    catalogue_item_id: int,
    payload: CatalogueItemUpdate,
) -> CatalogueItem:
    item = get_catalogue_item(
        db,
        catalogue_item_id,
    )

    update_data = payload.model_dump(
        exclude_unset=True,
    )

    category_id = update_data.get(
        "category_id"
    )

    if category_id is not None:
        category = db.get(
            ItemCategory,
            category_id,
        )

        if (
            category is None
            or not category.active
        ):
            raise bad_request(
                "Invalid or inactive item category.",
            )

    purchase_uom_id = update_data.get(
        "purchase_uom_id"
    )

    if purchase_uom_id is not None:
        purchase_uom = db.get(
            UnitOfMeasure,
            purchase_uom_id,
        )

        if (
            purchase_uom is None
            or not purchase_uom.active
        ):
            raise bad_request(
                "Invalid or inactive purchase UOM.",
            )

    stock_uom_id = update_data.get(
        "stock_uom_id"
    )

    if stock_uom_id is not None:
        stock_uom = db.get(
            UnitOfMeasure,
            stock_uom_id,
        )

        if (
            stock_uom is None
            or not stock_uom.active
        ):
            raise bad_request(
                "Invalid or inactive stock UOM.",
            )

    resulting_conversion_factor = (
        update_data.get(
            "conversion_factor",
            item.conversion_factor,
        )
    )

    resulting_shelf_life_days = (
        update_data.get(
            "shelf_life_days",
            item.shelf_life_days,
        )
    )

    _validate_catalogue_measurements(
        conversion_factor=(
            resulting_conversion_factor
        ),
        shelf_life_days=(
            resulting_shelf_life_days
        ),
    )

    valid_statuses = {
        "ACTIVE",
        "INACTIVE",
    }

    new_status = update_data.get(
        "status"
    )

    if new_status is not None:
        normalized_status = (
            new_status
            .strip()
            .upper()
        )

        if (
            normalized_status
            not in valid_statuses
        ):
            raise bad_request(
                "Invalid catalogue item status.",
            )

        update_data["status"] = (
            normalized_status
        )

    item_name = update_data.get(
        "item_name"
    )

    if (
        item_name is not None
        and not item_name.strip()
    ):
        raise bad_request(
            "Item name cannot be blank.",
        )

    for field, value in (
        update_data.items()
    ):
        setattr(
            item,
            field,
            value,
        )

    item.updated_at = datetime.now(
        timezone.utc
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(item)
    return item


# ============================================================
# SUPPLIER ITEMS / SUPPLIER PRICING
# ============================================================

def get_supplier_items_for_catalogue_item(
    db: Session,
    catalogue_item_id: int,
) -> list[SupplierItem]:
    get_catalogue_item(
        db,
        catalogue_item_id,
    )

    statement = (
        select(SupplierItem)
        .where(
            SupplierItem.catalogue_item_id
            == catalogue_item_id,
        )
        .order_by(
            SupplierItem.preferred_supplier.desc(),
            SupplierItem.supplier_item_id,
        )
    )

    return list(
        db.scalars(statement).all()
    )


def create_supplier_item(
    db: Session,
    payload: SupplierItemCreate,
) -> SupplierItem:
    get_active_catalogue_item(
        db,
        payload.catalogue_item_id,
    )

    _get_active_supplier(
        db,
        payload.supplier_id,
    )

    purchase_uom = db.get(
        UnitOfMeasure,
        payload.purchase_uom_id,
    )

    if (
        purchase_uom is None
        or not purchase_uom.active
    ):
        raise bad_request(
            "Invalid or inactive purchase UOM.",
        )

    _get_active_currency(
        db,
        payload.currency_code,
    )

    _validate_supplier_pricing_values(
        unit_price=(
            payload.unit_price
        ),
        minimum_order_quantity=(
            payload.minimum_order_quantity
        ),
        lead_time_days=(
            payload.lead_time_days
        ),
        effective_from=(
            payload.effective_from
        ),
        effective_to=(
            payload.effective_to
        ),
    )

    existing_link = db.scalar(
        select(SupplierItem).where(
            SupplierItem.supplier_id
            == payload.supplier_id,
            SupplierItem.catalogue_item_id
            == payload.catalogue_item_id,
            SupplierItem.active.is_(True),
        )
    )

    if existing_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This supplier is already linked "
                "to the catalogue item."
            ),
        )

    if payload.preferred_supplier:
        existing_preferred = db.scalar(
            select(SupplierItem).where(
                SupplierItem.catalogue_item_id
                == payload.catalogue_item_id,
                SupplierItem.preferred_supplier.is_(True),
                SupplierItem.active.is_(True),
                SupplierItem.effective_to.is_(None),
            )
        )

        if existing_preferred is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This catalogue item already has "
                    "an active preferred supplier."
                ),
            )

    now = datetime.now(
        timezone.utc
    )

    supplier_item = SupplierItem(
        supplier_id=(
            payload.supplier_id
        ),
        catalogue_item_id=(
            payload.catalogue_item_id
        ),
        supplier_item_code=(
            payload.supplier_item_code
        ),
        purchase_uom_id=(
            payload.purchase_uom_id
        ),
        unit_price=(
            payload.unit_price
        ),
        currency_code=(
            payload.currency_code
            .strip()
            .upper()
        ),
        minimum_order_quantity=(
            payload.minimum_order_quantity
        ),
        lead_time_days=(
            payload.lead_time_days
        ),
        preferred_supplier=(
            payload.preferred_supplier
        ),
        effective_from=(
            payload.effective_from
        ),
        effective_to=(
            payload.effective_to
        ),
        active=payload.active,
        created_at=now,
        created_by=payload.created_by,
        updated_at=now,
        updated_by=payload.updated_by,
    )

    try:
        db.add(supplier_item)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(supplier_item)
    return supplier_item


def update_supplier_item(
    db: Session,
    supplier_item_id: int,
    payload: SupplierItemUpdate,
) -> SupplierItem:
    supplier_item = db.get(
        SupplierItem,
        supplier_item_id,
    )

    if supplier_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier item link not found.",
        )

    update_data = payload.model_dump(
        exclude_unset=True,
    )

    purchase_uom_id = update_data.get(
        "purchase_uom_id"
    )

    if purchase_uom_id is not None:
        purchase_uom = db.get(
            UnitOfMeasure,
            purchase_uom_id,
        )

        if (
            purchase_uom is None
            or not purchase_uom.active
        ):
            raise bad_request(
                "Invalid or inactive purchase UOM.",
            )

    resulting_currency = (
        update_data.get(
            "currency_code",
            supplier_item.currency_code,
        )
    )

    _get_active_currency(
        db,
        resulting_currency,
    )

    resulting_unit_price = (
        update_data.get(
            "unit_price",
            supplier_item.unit_price,
        )
    )

    resulting_moq = (
        update_data.get(
            "minimum_order_quantity",
            supplier_item.minimum_order_quantity,
        )
    )

    resulting_lead_time = (
        update_data.get(
            "lead_time_days",
            supplier_item.lead_time_days,
        )
    )

    resulting_from = (
        update_data.get(
            "effective_from",
            supplier_item.effective_from,
        )
    )

    resulting_to = (
        update_data.get(
            "effective_to",
            supplier_item.effective_to,
        )
    )

    _validate_supplier_pricing_values(
        unit_price=(
            resulting_unit_price
        ),
        minimum_order_quantity=(
            resulting_moq
        ),
        lead_time_days=(
            resulting_lead_time
        ),
        effective_from=(
            resulting_from
        ),
        effective_to=(
            resulting_to
        ),
    )

    if (
        update_data.get(
            "preferred_supplier"
        )
        is True
    ):
        existing_preferred = db.scalar(
            select(SupplierItem).where(
                SupplierItem.catalogue_item_id
                == supplier_item.catalogue_item_id,
                SupplierItem.supplier_item_id
                != supplier_item_id,
                SupplierItem.preferred_supplier.is_(True),
                SupplierItem.active.is_(True),
                SupplierItem.effective_to.is_(None),
            )
        )

        if existing_preferred is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This catalogue item already has "
                    "another active preferred supplier."
                ),
            )

    if "currency_code" in update_data:
        update_data["currency_code"] = (
            str(
                update_data["currency_code"]
            )
            .strip()
            .upper()
        )

    for field, value in (
        update_data.items()
    ):
        setattr(
            supplier_item,
            field,
            value,
        )

    supplier_item.updated_at = (
        datetime.now(
            timezone.utc
        )
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(supplier_item)
    return supplier_item
