from app.db.session import engine

from app.models.approval import Approval
from app.models.document_status_history import DocumentStatusHistory
from app.models.goods_receipt import GoodsReceipt
from app.models.goods_receipt_item import GoodsReceiptItem
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.purchase_request import PurchaseRequest
from app.models.purchase_request_item import PurchaseRequestItem
from app.models.supplier import Supplier


def create_procurement_tables() -> None:
    tables = [
        Supplier.__table__,
        PurchaseRequest.__table__,
        PurchaseRequestItem.__table__,
        PurchaseOrder.__table__,
        PurchaseOrderItem.__table__,
        Approval.__table__,
        DocumentStatusHistory.__table__,
        GoodsReceipt.__table__,
        GoodsReceiptItem.__table__,
    ]

    for table in tables:
        table.create(
            bind=engine,
            checkfirst=True,
        )

        print(
            f"Table ready: "
            f"{table.schema}.{table.name}"
        )

    print(
        "All NEXORA Procurement tables "
        "are ready."
    )


if __name__ == "__main__":
    create_procurement_tables()