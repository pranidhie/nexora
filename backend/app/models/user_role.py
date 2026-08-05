from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        Index(
            "uq_user_roles_active_assignment",
            "user_id",
            "role_id",
            unique=True,
            postgresql_where="active = true",
        ),
        {"schema": "procurement"},
    )

    user_role_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    role_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.roles.role_id",
            onupdate="CASCADE",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    assigned_by: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "procurement.users.user_id",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        index=True,
    )

    def __repr__(self) -> str:
        return (
            f"UserRole(user_role_id={self.user_role_id}, "
            f"user_id={self.user_id}, "
            f"role_id={self.role_id}, "
            f"active={self.active!r})"
        )
