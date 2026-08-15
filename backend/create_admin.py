from sqlalchemy import select, text

from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models.user import User


ADMIN_EMAIL = "admin@nexora.com"
ADMIN_PASSWORD = "Nexora@123"


def create_admin() -> None:
    # Make sure the procurement schema exists
    with engine.begin() as connection:
        connection.execute(
            text("CREATE SCHEMA IF NOT EXISTS procurement")
        )

    # Make sure the users table exists
    User.__table__.create(
        bind=engine,
        checkfirst=True,
    )

    # Open a database session
    with SessionLocal() as db:

        # Check whether the admin user already exists
        existing_user = db.scalar(
            select(User).where(
                User.email == ADMIN_EMAIL
            )
        )

        # If admin already exists, reset the password
        if existing_user:
            existing_user.password_hash = hash_password(ADMIN_PASSWORD)
            existing_user.status = "ACTIVE"

            db.commit()

            print("Admin user password reset successfully.")
            return

        # If admin does not exist, create a new admin user
        admin = User(
            first_name="NEXORA",
            last_name="Administrator",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            status="ACTIVE",
        )

        db.add(admin)
        db.commit()

        print("Users table and admin user created successfully.")


if __name__ == "__main__":
    create_admin()