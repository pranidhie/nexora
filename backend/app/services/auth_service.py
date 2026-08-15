from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """Validate a user's email, password and account status."""

    normalized_email = email.strip().lower()

    statement = select(User).where(
        User.email == normalized_email
    )

    user = db.scalar(statement)

    if user is None:
        return None

    if user.status != "ACTIVE":
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return user