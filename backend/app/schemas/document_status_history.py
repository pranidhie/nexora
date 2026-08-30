from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentStatusHistoryCreate(BaseModel):
    document_type: str = Field(
        min_length=2,
        max_length=30,
    )
    document_id: int
    previous_status: str | None = Field(
        default=None,
        max_length=30,
    )
    new_status: str = Field(
        min_length=2,
        max_length=30,
    )
    changed_by_user_id: int
    reason: str | None = None


class DocumentStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status_history_id: int
    document_type: str
    document_id: int
    previous_status: str | None
    new_status: str
    changed_by_user_id: int
    reason: str | None
    changed_at: datetime