from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.procurement_rules import (
    LOCKED_PO_STATUSES,
    bad_request,
    conflict,
    require_non_blank,
    validate_po_status_transition,
)
from app.models.catalogue import (
    CatalogueItem,
    SupplierItem,
)
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.purchase_request import PurchaseRequest
from app.models.supplier import Supplier
from app.models.tax_currency import (
    Currency,
    ExchangeRate,
    TaxCode,
)
from app.models.warehouse import (
    Warehouse,
    WarehouseLocation,
)
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
)


BASE_CURRENCY_CODE = "AUD"


# ============================================================
# MONEY / ROUNDING
# ============================================================

def money(
    value: Decimal,
) -> Decimal:
    return value.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


# ============================================================
# GET / LIST
# ============================================================

def get_purchase_order_by_id(
    db: Session,
    purchase_order_id: int,
) -> PurchaseOrder | None:
    return db.get(
        PurchaseOrder,
        purchase_order_id,
    )


def list_purchase_orders(
    db: Session,
) -> list[PurchaseOrder]:
    return list(
        db.scalars(
            select(PurchaseOrder)
            .order_by(
                PurchaseOrder.created_at.desc()
            )
        ).all()
    )


# ============================================================
# PO NUMBER
# ============================================================

def generate_po_number(
    db: Session,
) -> str:
    latest_po = db.scalar(
        select(PurchaseOrder)
        .order_by(
            PurchaseOrder.purchase_order_id.desc()
        )
        .limit(1)
    )

    next_number = (
        latest_po.purchase_order_id + 1
        if latest_po
        else 1
    )

    return f"PO-{next_number:05d}"


# ============================================================
# MASTER DATA VALIDATION
# ============================================================

def get_active_supplier(
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
            detail="Selected supplier does not exist.",
        )

    if not supplier.is_active:
        raise bad_request(
            "Inactive suppliers cannot be used "
            "for new purchase orders.",
        )

    return supplier


def get_active_currency(
    db: Session,
    currency_code: str,
) -> Currency:
    code = (
        currency_code
        .strip()
        .upper()
    )

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


def validate_source_purchase_request(
    db: Session,
    purchase_request_id: int | None,
) -> None:
    if purchase_request_id is None:
        return

    request = db.get(
        PurchaseRequest,
        purchase_request_id,
    )

    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source purchase request does not exist.",
        )

    request_status = (
        request.status
        .strip()
        .upper()
    )

    if request_status in {
        "CANCELLED",
        "REJECTED",
        "CLOSED",
    }:
        raise bad_request(
            f"Purchase request {request.request_number} "
            f"cannot be used because its status is "
            f"{request_status}.",
        )


def get_active_catalogue_item_by_code(
    db: Session,
    item_code: str | None,
) -> CatalogueItem:
    code = require_non_blank(
        item_code,
        "Catalogue item code",
    ).upper()

    item = db.scalar(
        select(CatalogueItem).where(
            CatalogueItem.item_code == code,
        )
    )

    if item is None:
        raise bad_request(
            f"Catalogue item {code} does not exist.",
        )

    if (
        item.status.strip().upper()
        != "ACTIVE"
    ):
        raise bad_request(
            f"Catalogue item {code} is inactive.",
        )

    return item


# ============================================================
# SUPPLIER PRICING VALIDATION
# ============================================================

def get_valid_supplier_pricing(
    db: Session,
    *,
    supplier_id: int,
    catalogue_item_id: int,
    currency_code: str,
    quantity: Decimal,
) -> SupplierItem:
    today = date.today()

    statement = (
        select(SupplierItem)
        .where(
            SupplierItem.supplier_id
            == supplier_id,
            SupplierItem.catalogue_item_id
            == catalogue_item_id,
            SupplierItem.active.is_(True),
            SupplierItem.currency_code
            == currency_code,
            SupplierItem.effective_from
            <= today,
        )
        .order_by(
            SupplierItem.preferred_supplier.desc(),
            SupplierItem.effective_from.desc(),
            SupplierItem.supplier_item_id.desc(),
        )
    )

    candidates = list(
        db.scalars(statement).all()
    )

    valid_links = [
        link
        for link in candidates
        if (
            link.effective_to is None
            or link.effective_to >= today
        )
    ]

    if not valid_links:
        raise bad_request(
            "No active supplier pricing exists for "
            "the selected supplier, item and currency.",
        )

    link = valid_links[0]

    if (
        link.minimum_order_quantity
        is not None
        and quantity
        < Decimal(
            str(
                link.minimum_order_quantity
            )
        )
    ):
        raise bad_request(
            f"Quantity for catalogue item is below "
            f"the supplier minimum order quantity "
            f"of {link.minimum_order_quantity}.",
        )

    return link


# ============================================================
# WAREHOUSE VALIDATION
# ============================================================

def validate_warehouse_destination(
    db: Session,
    warehouse_id: int | None,
    receiving_location_id: int | None,
) -> None:
    if (
        warehouse_id is None
        and receiving_location_id is None
    ):
        return

    if warehouse_id is None:
        raise bad_request(
            "Warehouse must be selected when "
            "a receiving location is provided.",
        )

    if receiving_location_id is None:
        raise bad_request(
            "Receiving location must be selected "
            "for the warehouse.",
        )

    warehouse = db.get(
        Warehouse,
        warehouse_id,
    )

    if warehouse is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selected warehouse does not exist.",
        )

    if not warehouse.is_active:
        raise bad_request(
            "Selected warehouse is inactive.",
        )

    location = db.get(
        WarehouseLocation,
        receiving_location_id,
    )

    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Selected receiving location "
                "does not exist."
            ),
        )

    if (
        location.warehouse_id
        != warehouse_id
    ):
        raise bad_request(
            "Selected receiving location does "
            "not belong to the selected warehouse.",
        )

    if not location.is_active:
        raise bad_request(
            "Selected receiving location is inactive.",
        )

    if not location.is_receiving_location:
        raise bad_request(
            "Selected warehouse location is not "
            "configured as a receiving location.",
        )


# ============================================================
# TAX
# ============================================================

def get_valid_tax_code(
    db: Session,
    tax_code_id: int,
) -> TaxCode:
    tax_code = db.get(
        TaxCode,
        tax_code_id,
    )

    if tax_code is None:
        raise bad_request(
            f"Invalid tax code ID: {tax_code_id}.",
        )

    if not tax_code.is_active:
        raise bad_request(
            f"Tax code {tax_code.tax_code} is inactive.",
        )

    return tax_code


def calculate_tax(
    line_subtotal: Decimal,
    tax_rate: Decimal,
) -> Decimal:
    return money(
        line_subtotal
        * tax_rate
        / Decimal("100")
    )


# ============================================================
# FX / BASE CURRENCY
# ============================================================

def resolve_exchange_rate(
    db: Session,
    from_currency_code: str,
) -> Decimal:
    source = (
        from_currency_code
        .strip()
        .upper()
    )

    if source == BASE_CURRENCY_CODE:
        return Decimal("1.000000")

    today = date.today()

    rate = db.scalar(
        select(ExchangeRate)
        .where(
            ExchangeRate.from_currency_code
            == source,
            ExchangeRate.to_currency_code
            == BASE_CURRENCY_CODE,
            ExchangeRate.is_active.is_(True),
            ExchangeRate.effective_date
            <= today,
        )
        .order_by(
            ExchangeRate.effective_date.desc(),
            ExchangeRate.exchange_rate_id.desc(),
        )
        .limit(1)
    )

    if rate is None:
        raise bad_request(
            f"No active exchange rate exists from "
            f"{source} to {BASE_CURRENCY_CODE}.",
        )

    exchange_rate = Decimal(
        str(
            rate.exchange_rate
        )
    )

    if exchange_rate <= 0:
        raise bad_request(
            "Exchange rate must be greater than zero.",
        )

    return exchange_rate


# ============================================================
# CREATE PURCHASE ORDER
# ============================================================

def create_purchase_order(
    db: Session,
    order_data: PurchaseOrderCreate,
) -> PurchaseOrder:
    get_active_supplier(
        db,
        order_data.supplier_id,
    )

    validate_source_purchase_request(
        db,
        order_data.purchase_request_id,
    )

    validate_warehouse_destination(
        db=db,
        warehouse_id=(
            order_data.warehouse_id
        ),
        receiving_location_id=(
            order_data.receiving_location_id
        ),
    )

    currency_code = (
        order_data.currency
        .strip()
        .upper()
    )

    get_active_currency(
        db,
        currency_code,
    )

    exchange_rate = resolve_exchange_rate(
        db,
        currency_code,
    )

    if not order_data.items:
        raise bad_request(
            "Purchase order must contain "
            "at least one item.",
        )

    po_number = generate_po_number(
        db
    )

    purchase_order = PurchaseOrder(
        po_number=po_number,
        supplier_id=(
            order_data.supplier_id
        ),
        purchase_request_id=(
            order_data.purchase_request_id
        ),
        created_by_user_id=(
            order_data.created_by_user_id
        ),
        warehouse_id=(
            order_data.warehouse_id
        ),
        receiving_location_id=(
            order_data.receiving_location_id
        ),
        status="DRAFT",
        currency=currency_code,
        base_currency=BASE_CURRENCY_CODE,
        exchange_rate=exchange_rate,
        subtotal=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        total_amount=Decimal("0.00"),
        base_subtotal=Decimal("0.00"),
        base_tax_amount=Decimal("0.00"),
        base_total_amount=Decimal("0.00"),
        delivery_address=(
            order_data.delivery_address.strip()
            if order_data.delivery_address
            else None
        ),
        notes=(
            order_data.notes.strip()
            if order_data.notes
            else None
        ),
        expected_delivery_date=(
            order_data.expected_delivery_date
        ),
    )

    db.add(
        purchase_order
    )
    db.flush()

    subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")

    for item_data in (
        order_data.items
    ):
        quantity = Decimal(
            str(
                item_data.quantity
            )
        )

        if quantity <= 0:
            raise bad_request(
                "Purchase order quantity "
                "must be greater than zero.",
            )

        catalogue_item = (
            get_active_catalogue_item_by_code(
                db,
                item_data.item_code,
            )
        )

        supplier_price = (
            get_valid_supplier_pricing(
                db,
                supplier_id=(
                    order_data.supplier_id
                ),
                catalogue_item_id=(
                    catalogue_item.catalogue_item_id
                ),
                currency_code=(
                    currency_code
                ),
                quantity=quantity,
            )
        )

        # V1 rule:
        # Server is authoritative for supplier price.
        unit_price = Decimal(
            str(
                supplier_price.unit_price
            )
        )

        if unit_price <= 0:
            raise bad_request(
                "Supplier unit price must "
                "be greater than zero.",
            )

        description = (
            require_non_blank(
                item_data.description,
                "Purchase order line description",
            )
        )

        unit_of_measure = (
            require_non_blank(
                item_data.unit_of_measure,
                "Unit of measure",
            )
            .upper()
        )

        tax_code = (
            get_valid_tax_code(
                db=db,
                tax_code_id=(
                    item_data.tax_code_id
                ),
            )
        )

        tax_rate = Decimal(
            str(
                tax_code.tax_rate
            )
        )

        line_subtotal = money(
            quantity
            * unit_price
        )

        tax_amount = calculate_tax(
            line_subtotal=(
                line_subtotal
            ),
            tax_rate=(
                tax_rate
            ),
        )

        line_total = money(
            line_subtotal
            + tax_amount
        )

        subtotal += line_subtotal
        total_tax += tax_amount

        item = PurchaseOrderItem(
            purchase_order_id=(
                purchase_order
                .purchase_order_id
            ),
            item_code=(
                catalogue_item.item_code
                .strip()
                .upper()
            ),
            description=description,
            quantity=quantity,
            unit_of_measure=(
                unit_of_measure
            ),
            unit_price=(
                unit_price
            ),
            tax_code_id=(
                item_data.tax_code_id
            ),
            tax_rate=(
                tax_rate
            ),
            tax_amount=(
                tax_amount
            ),
            line_total=(
                line_total
            ),
            notes=(
                item_data.notes.strip()
                if item_data.notes
                else None
            ),
        )

        db.add(item)

    purchase_order.subtotal = money(
        subtotal
    )

    purchase_order.tax_amount = money(
        total_tax
    )

    purchase_order.total_amount = money(
        subtotal
        + total_tax
    )

    purchase_order.base_subtotal = money(
        purchase_order.subtotal
        * exchange_rate
    )

    purchase_order.base_tax_amount = money(
        purchase_order.tax_amount
        * exchange_rate
    )

    purchase_order.base_total_amount = money(
        purchase_order.total_amount
        * exchange_rate
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(
        purchase_order
    )

    return purchase_order


# ============================================================
# UPDATE PURCHASE ORDER
# ============================================================

def update_purchase_order(
    db: Session,
    purchase_order: PurchaseOrder,
    order_data: PurchaseOrderUpdate,
) -> PurchaseOrder:
    current_status = (
        purchase_order.status
        .strip()
        .upper()
    )

    if (
        current_status
        in LOCKED_PO_STATUSES
    ):
        raise conflict(
            f"Purchase order cannot be edited while "
            f"its status is {current_status}.",
        )

    update_data = (
        order_data.model_dump(
            exclude_unset=True
        )
    )

    # Supplier and currency define commercial pricing.
    # Changing them without repricing all PO lines is unsafe.
    if (
        "supplier_id"
        in update_data
        and update_data["supplier_id"]
        != purchase_order.supplier_id
    ):
        raise conflict(
            "Supplier cannot be changed on an existing "
            "purchase order. Create a new purchase order.",
        )

    if (
        "currency"
        in update_data
        and str(
            update_data["currency"]
        ).strip().upper()
        != purchase_order.currency
    ):
        raise conflict(
            "Currency cannot be changed on an existing "
            "purchase order. Create a new purchase order.",
        )

    warehouse_id = (
        update_data.get(
            "warehouse_id",
            purchase_order.warehouse_id,
        )
    )

    receiving_location_id = (
        update_data.get(
            "receiving_location_id",
            purchase_order.receiving_location_id,
        )
    )

    validate_warehouse_destination(
        db=db,
        warehouse_id=warehouse_id,
        receiving_location_id=(
            receiving_location_id
        ),
    )

    warehouse_changed = (
        "warehouse_id"
        in update_data
        and update_data[
            "warehouse_id"
        ]
        != purchase_order.warehouse_id
    )

    location_changed = (
        "receiving_location_id"
        in update_data
        and update_data[
            "receiving_location_id"
        ]
        != purchase_order
        .receiving_location_id
    )

    delivery_address_changed = (
        "delivery_address"
        in update_data
        and update_data[
            "delivery_address"
        ]
        != purchase_order.delivery_address
    )

    delivery_date_changed = (
        "expected_delivery_date"
        in update_data
        and update_data[
            "expected_delivery_date"
        ]
        != purchase_order
        .expected_delivery_date
    )

    requested_status = (
        update_data.get(
            "status"
        )
    )

    if requested_status is not None:
        normalized_status = (
            str(
                requested_status
            )
            .strip()
            .upper()
        )

        validate_po_status_transition(
            current_status,
            normalized_status,
        )

        update_data["status"] = (
            normalized_status
        )

    for field, value in (
        update_data.items()
    ):
        if field in {
            "supplier_id",
            "currency",
        }:
            continue

        if isinstance(
            value,
            str,
        ):
            value = (
                value.strip()
            )

        setattr(
            purchase_order,
            field,
            value,
        )

    material_change = (
        warehouse_changed
        or location_changed
        or delivery_address_changed
        or delivery_date_changed
    )

    if (
        material_change
        and current_status
        == "APPROVED"
    ):
        purchase_order.status = (
            "PENDING_APPROVAL"
        )

    purchase_order.updated_at = (
        datetime.now(
            timezone.utc
        )
    )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(
        purchase_order
    )

    return purchase_order
