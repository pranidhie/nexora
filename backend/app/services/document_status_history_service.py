from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_status_history import (
    DocumentStatusHistory,
)
from app.schemas.document_status_history import (
    DocumentStatusHistoryCreate,
)


def list_status_history(
    db: Session,
) -> list[DocumentStatusHistory]:
    return list(
        db.scalars(
            select(DocumentStatusHistory).order_by(
                DocumentStatusHistory.changed_at.desc()
            )
        ).all()
    )


def get_document_status_history(
    db: Session,
    document_type: str,
    document_id: int,
) -> list[DocumentStatusHistory]:
    normalized_type = document_type.strip().upper()

    return list(
        db.scalars(
            select(DocumentStatusHistory)
            .where(
                DocumentStatusHistory.document_type
                == normalized_type,
                DocumentStatusHistory.document_id
                == document_id,
            )
            .order_by(
                DocumentStatusHistory.changed_at.asc()
            )
        ).all()
    )


def create_status_history(
    db: Session,
    history_data: DocumentStatusHistoryCreate,
) -> DocumentStatusHistory:
    history = DocumentStatusHistory(
        document_type=(
            history_data.document_type.strip().upper()
        ),
        document_id=history_data.document_id,
        previous_status=(
            history_data.previous_status.strip().upper()
            if history_data.previous_status
            else None
        ),
        new_status=(
            history_data.new_status.strip().upper()
        ),
        changed_by_user_id=(
            history_data.changed_by_user_id
        ),
        reason=(
            history_data.reason.strip()
            if history_data.reason
            else None
        ),
    )

    db.add(history)
    db.commit()
    db.refresh(history)

    return history