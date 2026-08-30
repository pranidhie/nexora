from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.approval import Approval
from app.models.document_status_history import (
    DocumentStatusHistory,
)
from app.models.purchase_order import PurchaseOrder
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalDecision,
)


def get_approval_by_id(
    db: Session,
    approval_id: int,
) -> Approval | None:
    return db.get(
        Approval,
        approval_id,
    )


def list_approvals(
    db: Session,
) -> list[Approval]:
    return list(
        db.scalars(
            select(Approval).order_by(
                Approval.created_at.desc()
            )
        ).all()
    )


def get_pending_approval_for_document(
    db: Session,
    document_type: str,
    document_id: int,
) -> Approval | None:
    return db.scalar(
        select(Approval).where(
            Approval.document_type
            == document_type,
            Approval.document_id
            == document_id,
            Approval.status
            == "PENDING",
        )
    )


def create_approval(
    db: Session,
    approval_data: ApprovalCreate,
) -> Approval:
    document_type = (
        approval_data.document_type
        .strip()
        .upper()
    )

    existing_approval = (
        get_pending_approval_for_document(
            db,
            document_type,
            approval_data.document_id,
        )
    )

    if existing_approval:
        raise ValueError(
            "A pending approval already exists "
            "for this document."
        )

    # ============================================================
    # PURCHASE ORDER SUBMISSION
    # ============================================================

    if document_type == "PURCHASE_ORDER":
        purchase_order = db.get(
            PurchaseOrder,
            approval_data.document_id,
        )

        if not purchase_order:
            raise ValueError(
                "Purchase order not found."
            )

        if purchase_order.status != "DRAFT":
            raise ValueError(
                "Only a DRAFT purchase order "
                "can be submitted for approval."
            )

        previous_status = (
            purchase_order.status
        )

        purchase_order.status = (
            "PENDING_APPROVAL"
        )

        status_history = (
            DocumentStatusHistory(
                document_type=(
                    "PURCHASE_ORDER"
                ),
                document_id=(
                    purchase_order
                    .purchase_order_id
                ),
                previous_status=(
                    previous_status
                ),
                new_status=(
                    "PENDING_APPROVAL"
                ),
                changed_by_user_id=(
                    approval_data
                    .approver_user_id
                ),
                reason=(
                    "Purchase order "
                    "submitted for approval."
                ),
            )
        )

        db.add(status_history)

    # ============================================================
    # CREATE APPROVAL
    # ============================================================

    approval = Approval(
        document_type=document_type,
        document_id=(
            approval_data.document_id
        ),
        approver_user_id=(
            approval_data.approver_user_id
        ),
        approval_level=(
            approval_data.approval_level
        ),
        status="PENDING",
        comments=(
            approval_data.comments.strip()
            if approval_data.comments
            else None
        ),
    )

    db.add(approval)

    db.commit()
    db.refresh(approval)

    return approval


def decide_approval(
    db: Session,
    approval: Approval,
    decision_data: ApprovalDecision,
) -> Approval:
    decision_status = (
        decision_data.status
        .strip()
        .upper()
    )

    allowed_statuses = {
        "APPROVED",
        "REJECTED",
    }

    if (
        decision_status
        not in allowed_statuses
    ):
        raise ValueError(
            "Approval status must be "
            "APPROVED or REJECTED."
        )

    if approval.status != "PENDING":
        raise ValueError(
            "Only a PENDING approval "
            "can be decided."
        )

    approval.status = decision_status

    approval.comments = (
        decision_data.comments.strip()
        if decision_data.comments
        else approval.comments
    )

    approval.decision_at = (
        datetime.now(
            timezone.utc
        )
    )

    # ============================================================
    # PURCHASE ORDER DECISION
    # ============================================================

    if (
        approval.document_type
        == "PURCHASE_ORDER"
    ):
        purchase_order = db.get(
            PurchaseOrder,
            approval.document_id,
        )

        if not purchase_order:
            raise ValueError(
                "Purchase order linked "
                "to this approval "
                "was not found."
            )

        previous_status = (
            purchase_order.status
        )

        purchase_order.status = (
            decision_status
        )

        status_history = (
            DocumentStatusHistory(
                document_type=(
                    "PURCHASE_ORDER"
                ),
                document_id=(
                    purchase_order
                    .purchase_order_id
                ),
                previous_status=(
                    previous_status
                ),
                new_status=(
                    decision_status
                ),
                changed_by_user_id=(
                    approval
                    .approver_user_id
                ),
                reason=(
                    decision_data
                    .comments.strip()
                    if decision_data.comments
                    else (
                        "Purchase order "
                        f"{decision_status.lower()}."
                    )
                ),
            )
        )

        db.add(
            status_history
        )

    db.commit()
    db.refresh(approval)

    return approval