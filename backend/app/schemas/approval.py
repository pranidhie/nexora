from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ApprovalCreate(BaseModel):
    document_type: str = Field(
        min_length=2,
        max_length=30,
    )
    document_id: int
    approver_user_id: int
    approval_level: int = Field(
        default=1,
        ge=1,
    )
    comments: str | None = None


class ApprovalDecision(BaseModel):
    status: str = Field(
        min_length=2,
        max_length=30,
    )
    comments: str | None = None


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    approval_id: int
    document_type: str
    document_id: int
    approver_user_id: int
    approval_level: int
    status: str
    comments: str | None
    decision_at: datetime | None
    created_at: datetime