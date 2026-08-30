from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.catalogue import CatalogueItem
from app.models.document_status_history import DocumentStatusHistory
from app.models.goods_receipt import GoodsReceipt
from app.models.goods_receipt_item import GoodsReceiptItem
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.schemas.goods_receipt import GoodsReceiptCreate
from app.services.inventory_service import post_receipt_to_inventory


def get_goods_receipt_by_id(db: Session, goods_receipt_id: int) -> GoodsReceipt | None:
    return db.get(GoodsReceipt, goods_receipt_id)


def list_goods_receipts(db: Session) -> list[GoodsReceipt]:
    return list(db.scalars(select(GoodsReceipt).order_by(GoodsReceipt.created_at.desc())).all())


def generate_receipt_number(db: Session) -> str:
    latest_receipt = db.scalar(select(GoodsReceipt).order_by(GoodsReceipt.goods_receipt_id.desc()).limit(1))
    next_number = latest_receipt.goods_receipt_id + 1 if latest_receipt else 1
    return f'GRN-{next_number:05d}'


def get_previously_received_quantity(db: Session, purchase_order_item_id: int) -> Decimal:
    received_quantity = db.scalar(select(func.coalesce(func.sum(GoodsReceiptItem.received_quantity), 0)).where(GoodsReceiptItem.purchase_order_item_id == purchase_order_item_id))
    return Decimal(str(received_quantity or 0))


def is_purchase_order_fully_received(db: Session, purchase_order_id: int) -> bool:
    po_items = list(db.scalars(select(PurchaseOrderItem).where(PurchaseOrderItem.purchase_order_id == purchase_order_id)).all())
    if not po_items:
        return False
    for po_item in po_items:
        if get_previously_received_quantity(db, po_item.purchase_order_item_id) < Decimal(str(po_item.quantity)):
            return False
    return True


def create_goods_receipt(db: Session, receipt_data: GoodsReceiptCreate) -> GoodsReceipt:
    purchase_order = db.get(PurchaseOrder, receipt_data.purchase_order_id)
    if not purchase_order:
        raise ValueError('Purchase order not found.')
    if purchase_order.status not in {'APPROVED', 'PARTIALLY_RECEIVED'}:
        raise ValueError('Goods can only be received against an APPROVED or PARTIALLY_RECEIVED purchase order.')
    if not receipt_data.items:
        raise ValueError('At least one goods receipt item is required.')

    validated_items = []
    has_quantity = False

    for item_data in receipt_data.items:
        po_item = db.get(PurchaseOrderItem, item_data.purchase_order_item_id)
        if not po_item:
            raise ValueError(f'Purchase order item {item_data.purchase_order_item_id} was not found.')
        if po_item.purchase_order_id != purchase_order.purchase_order_id:
            raise ValueError('Receipt item does not belong to the selected purchase order.')

        ordered = Decimal(str(po_item.quantity))
        previously_received = get_previously_received_quantity(db, po_item.purchase_order_item_id)
        outstanding = ordered - previously_received
        received_now = Decimal(str(item_data.received_quantity))
        rejected_now = Decimal(str(item_data.rejected_quantity))

        if received_now < 0 or rejected_now < 0:
            raise ValueError('Received and rejected quantities cannot be negative.')
        if received_now > 0 or rejected_now > 0:
            has_quantity = True
        if outstanding <= 0 and (received_now > 0 or rejected_now > 0):
            raise ValueError(f'{po_item.description}: this purchase order line has already been fully received.')
        if received_now + rejected_now > outstanding:
            raise ValueError(f'{po_item.description}: received plus rejected quantity cannot exceed outstanding quantity of {outstanding}.')
        if not po_item.item_code:
            raise ValueError(f'{po_item.description}: PO item has no catalogue item code.')

        catalogue_item = db.scalar(select(CatalogueItem).where(CatalogueItem.item_code == po_item.item_code))
        if not catalogue_item:
            raise ValueError(f'Catalogue item {po_item.item_code} was not found.')

        validated_items.append((item_data, po_item, catalogue_item, ordered, received_now, rejected_now))

    if not has_quantity:
        raise ValueError('Enter a received or rejected quantity for at least one item.')

    receipt_number = generate_receipt_number(db)
    goods_receipt = GoodsReceipt(
        receipt_number=receipt_number,
        purchase_order_id=receipt_data.purchase_order_id,
        received_by_user_id=receipt_data.received_by_user_id,
        status='RECEIVED',
        delivery_reference=receipt_data.delivery_reference.strip() if receipt_data.delivery_reference else None,
        notes=receipt_data.notes.strip() if receipt_data.notes else None,
    )
    db.add(goods_receipt)
    db.flush()

    for item_data, po_item, catalogue_item, ordered, received_now, rejected_now in validated_items:
        receipt_item = GoodsReceiptItem(
            goods_receipt_id=goods_receipt.goods_receipt_id,
            purchase_order_item_id=po_item.purchase_order_item_id,
            item_code=po_item.item_code.strip().upper() if po_item.item_code else None,
            description=po_item.description.strip(),
            ordered_quantity=ordered,
            received_quantity=received_now,
            rejected_quantity=rejected_now,
            unit_of_measure=po_item.unit_of_measure.strip().upper(),
            notes=item_data.notes.strip() if item_data.notes else None,
        )
        db.add(receipt_item)
        db.flush()
        post_receipt_to_inventory(
            db,
            catalogue_item_id=catalogue_item.catalogue_item_id,
            received_quantity=received_now,
            unit_of_measure=po_item.unit_of_measure,
            goods_receipt_id=goods_receipt.goods_receipt_id,
            goods_receipt_item_id=receipt_item.goods_receipt_item_id,
            receipt_number=receipt_number,
            created_by_user_id=receipt_data.received_by_user_id,
            notes=item_data.notes.strip() if item_data.notes else None,
        )

    db.flush()
    previous_status = purchase_order.status
    new_status = 'RECEIVED' if is_purchase_order_fully_received(db, purchase_order.purchase_order_id) else 'PARTIALLY_RECEIVED'
    purchase_order.status = new_status
    if previous_status != new_status:
        db.add(DocumentStatusHistory(
            document_type='PURCHASE_ORDER',
            document_id=purchase_order.purchase_order_id,
            previous_status=previous_status,
            new_status=new_status,
            changed_by_user_id=receipt_data.received_by_user_id,
            reason=f'Goods receipt {receipt_number} created.',
        ))

    db.commit()
    db.refresh(goods_receipt)
    return goods_receipt
