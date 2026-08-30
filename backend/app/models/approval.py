from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class Approval(Base):
    __tablename__ = "approvals"
    __table_args__ = {"schema": "procurement"}

    approval_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    document_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    approver_user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    approval_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    decision_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )