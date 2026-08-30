from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalogue import CatalogueItem
from app.models.inventory import (
    InventoryBalance,
    InventoryTransaction,
)


def list_inventory_balances(
    db: Session,
) -> list[InventoryBalance]:
    return list(
        db.scalars(
            select(InventoryBalance)
            .order_by(
                InventoryBalance.catalogue_item_id
            )
        ).all()
    )


def list_inventory_transactions(
    db: Session,
    catalogue_item_id: int | None = None,
) -> list[InventoryTransaction]:
    statement = select(
        InventoryTransaction
    )

    if catalogue_item_id is not None:
        statement = statement.where(
            InventoryTransaction.catalogue_item_id
            == catalogue_item_id
        )

    statement = statement.order_by(
        InventoryTransaction.created_at.desc(),
        InventoryTransaction.inventory_transaction_id.desc(),
    )

    return list(
        db.scalars(statement).all()
    )


def get_or_create_inventory_balance(
    db: Session,
    catalogue_item_id: int,
    unit_of_measure: str,
) -> InventoryBalance:
    balance = db.scalar(
        select(InventoryBalance)
        .where(
            InventoryBalance.catalogue_item_id
            == catalogue_item_id
        )
        .with_for_update()
    )

    if balance:
        return balance

    catalogue_item = db.get(
        CatalogueItem,
        catalogue_item_id,
    )

    if not catalogue_item:
        raise ValueError(
            "Catalogue item linked to inventory transaction was not found."
        )

    balance = InventoryBalance(
        catalogue_item_id=catalogue_item_id,
        unit_of_measure=(
            unit_of_measure.strip().upper()
        ),
        on_hand_quantity=Decimal("0"),
        available_quantity=Decimal("0"),
        quarantine_quantity=Decimal("0"),
    )

    db.add(balance)
    db.flush()

    return balance


def inventory_transaction_exists(
    db: Session,
    source_document_type: str,
    source_document_id: int,
    source_line_id: int,
    transaction_type: str,
) -> bool:
    transaction = db.scalar(
        select(InventoryTransaction)
        .where(
            InventoryTransaction.source_document_type
            == source_document_type,
            InventoryTransaction.source_document_id
            == source_document_id,
            InventoryTransaction.source_line_id
            == source_line_id,
            InventoryTransaction.transaction_type
            == transaction_type,
        )
    )

    return transaction is not None


def post_receipt_to_inventory(
    db: Session,
    *,
    catalogue_item_id: int,
    received_quantity: Decimal,
    unit_of_measure: str,
    goods_receipt_id: int,
    goods_receipt_item_id: int,
    receipt_number: str,
    created_by_user_id: int,
    notes: str | None = None,
) -> None:
    if received_quantity <= 0:
        return

    if inventory_transaction_exists(
        db,
        "GOODS_RECEIPT",
        goods_receipt_id,
        goods_receipt_item_id,
        "RECEIPT",
    ):
        raise ValueError(
            "Inventory has already been posted for this goods receipt line."
        )

    balance = get_or_create_inventory_balance(
        db,
        catalogue_item_id,
        unit_of_measure,
    )

    balance.on_hand_quantity = (
        Decimal(
            str(
                balance.on_hand_quantity
            )
        )
        + received_quantity
    )

    balance.available_quantity = (
        Decimal(
            str(
                balance.available_quantity
            )
        )
        + received_quantity
    )

    balance.last_transaction_at = (
        datetime.now(
            timezone.utc
        )
    )

    transaction = InventoryTransaction(
        catalogue_item_id=catalogue_item_id,
        transaction_type="RECEIPT",
        quantity=received_quantity,
        unit_of_measure=(
            unit_of_measure.strip().upper()
        ),
        source_document_type="GOODS_RECEIPT",
        source_document_id=goods_receipt_id,
        source_line_id=goods_receipt_item_id,
        reference_number=receipt_number,
        notes=notes,
        created_by_user_id=created_by_user_id,
    )

    db.add(transaction)
    db.flush()