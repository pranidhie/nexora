from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.purchase_request import PurchaseRequest
from app.models.purchase_request_item import PurchaseRequestItem
from app.schemas.purchase_request import (
    PurchaseRequestCreate,
    PurchaseRequestUpdate,
)


def get_purchase_request_by_id(
    db: Session,
    purchase_request_id: int,
) -> PurchaseRequest | None:
    return db.get(
        PurchaseRequest,
        purchase_request_id,
    )


def list_purchase_requests(
    db: Session,
) -> list[PurchaseRequest]:
    return list(
        db.scalars(
            select(PurchaseRequest).order_by(
                PurchaseRequest.created_at.desc()
            )
        ).all()
    )


def generate_request_number(
    db: Session,
) -> str:
    latest_request = db.scalar(
        select(PurchaseRequest)
        .order_by(
            PurchaseRequest.purchase_request_id.desc()
        )
        .limit(1)
    )

    next_number = (
        latest_request.purchase_request_id + 1
        if latest_request
        else 1
    )

    return f"PR-{next_number:05d}"


def create_purchase_request(
    db: Session,
    request_data: PurchaseRequestCreate,
) -> PurchaseRequest:
    request_number = generate_request_number(db)

    purchase_request = PurchaseRequest(
        request_number=request_number,
        requested_by_user_id=request_data.requested_by_user_id,
        department=request_data.department.strip(),
        purpose=request_data.purpose.strip(),
        priority=request_data.priority.strip().upper(),
        status="DRAFT",
        required_by_date=request_data.required_by_date,
        total_estimated_amount=Decimal("0.00"),
    )

    db.add(purchase_request)
    db.flush()

    total_amount = Decimal("0.00")

    for item_data in request_data.items:
        quantity = Decimal(str(item_data.quantity))
        unit_price = Decimal(
            str(item_data.estimated_unit_price)
        )

        line_total = quantity * unit_price
        total_amount += line_total

        item = PurchaseRequestItem(
            purchase_request_id=(
                purchase_request.purchase_request_id
            ),
            item_code=(
                item_data.item_code.strip().upper()
                if item_data.item_code
                else None
            ),
            description=item_data.description.strip(),
            quantity=quantity,
            unit_of_measure=(
                item_data.unit_of_measure.strip().upper()
            ),
            estimated_unit_price=unit_price,
            estimated_total=line_total,
            notes=(
                item_data.notes.strip()
                if item_data.notes
                else None
            ),
        )

        db.add(item)

    purchase_request.total_estimated_amount = (
        total_amount
    )

    db.commit()
    db.refresh(purchase_request)

    return purchase_request


def update_purchase_request(
    db: Session,
    purchase_request: PurchaseRequest,
    request_data: PurchaseRequestUpdate,
) -> PurchaseRequest:
    update_data = request_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()

        if field in {"priority", "status"} and value:
            value = value.upper()

        setattr(
            purchase_request,
            field,
            value,
        )

    db.commit()
    db.refresh(purchase_request)

    return purchase_request