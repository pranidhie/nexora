import os

from sqlalchemy import select, text

from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models.user import User


ADMIN_EMAIL = os.getenv(
    "NEXORA_ADMIN_EMAIL",
    "admin@nexora.com",
)

ADMIN_PASSWORD = os.getenv(
    "NEXORA_ADMIN_PASSWORD",
)


def create_admin() -> None:
    if not ADMIN_PASSWORD:
        raise RuntimeError(
            "NEXORA_ADMIN_PASSWORD is not configured."
        )

    # Make sure the procurement schema exists.
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE SCHEMA IF NOT EXISTS procurement"
            )
        )

    # Make sure the users table exists.
    User.__table__.create(
        bind=engine,
        checkfirst=True,
    )

    # Open a database session.
    with SessionLocal() as db:
        existing_user = db.scalar(
            select(User).where(
                User.email == ADMIN_EMAIL
            )
        )

        # Reset the existing administrator to the
        # configured CI/local password.
        if existing_user:
            existing_user.password_hash = (
                hash_password(
                    ADMIN_PASSWORD
                )
            )
            existing_user.status = "ACTIVE"

            db.commit()

            print(
                "Admin user password reset successfully."
            )
            return

        # Create the administrator when it does not exist.
        admin = User(
            first_name="NEXORA",
            last_name="Administrator",
            email=ADMIN_EMAIL,
            password_hash=hash_password(
                ADMIN_PASSWORD
            ),
            status="ACTIVE",
        )

        db.add(admin)
        db.commit()

        print(
            "Users table and admin user created successfully."
        )


if __name__ == "__main__":
    create_admin()