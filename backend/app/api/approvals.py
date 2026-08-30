from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.approval import (
    ApprovalCreate,
    ApprovalDecision,
    ApprovalResponse,
)
from app.services.approval_service import (
    create_approval,
    decide_approval,
    get_approval_by_id,
    list_approvals,
)

router = APIRouter(
    prefix="/api/v1/approvals",
    tags=["Approvals"],
)


@router.get(
    "",
    response_model=list[ApprovalResponse],
)
def get_approvals(
    db: Session = Depends(get_db),
) -> list[ApprovalResponse]:
    return list_approvals(db)


@router.get(
    "/{approval_id}",
    response_model=ApprovalResponse,
)
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
) -> ApprovalResponse:
    approval = get_approval_by_id(
        db,
        approval_id,
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found.",
        )

    return approval


@router.post(
    "",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_approval(
    approval_data: ApprovalCreate,
    db: Session = Depends(get_db),
) -> ApprovalResponse:
    return create_approval(
        db,
        approval_data,
    )


@router.patch(
    "/{approval_id}/decision",
    response_model=ApprovalResponse,
)
def make_approval_decision(
    approval_id: int,
    decision_data: ApprovalDecision,
    db: Session = Depends(get_db),
) -> ApprovalResponse:
    approval = get_approval_by_id(
        db,
        approval_id,
    )

    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval not found.",
        )

    try:
        return decide_approval(
            db,
            approval,
            decision_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error