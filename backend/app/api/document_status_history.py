from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.document_status_history import (
    DocumentStatusHistoryCreate,
    DocumentStatusHistoryResponse,
)
from app.services.document_status_history_service import (
    create_status_history,
    get_document_status_history,
    list_status_history,
)

router = APIRouter(
    prefix="/api/v1/status-history",
    tags=["Document Status History"],
)


@router.get(
    "",
    response_model=list[DocumentStatusHistoryResponse],
)
def get_all_status_history(
    db: Session = Depends(get_db),
) -> list[DocumentStatusHistoryResponse]:
    return list_status_history(db)


@router.get(
    "/{document_type}/{document_id}",
    response_model=list[DocumentStatusHistoryResponse],
)
def get_history_for_document(
    document_type: str,
    document_id: int,
    db: Session = Depends(get_db),
) -> list[DocumentStatusHistoryResponse]:
    return get_document_status_history(
        db,
        document_type,
        document_id,
    )


@router.post(
    "",
    response_model=DocumentStatusHistoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_status_history(
    history_data: DocumentStatusHistoryCreate,
    db: Session = Depends(get_db),
) -> DocumentStatusHistoryResponse:
    return create_status_history(
        db,
        history_data,
    )