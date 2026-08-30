from app.db.session import engine
from app.models.supplier import Supplier


def create_supplier_table() -> None:
    Supplier.__table__.create(
        bind=engine,
        checkfirst=True,
    )

    print("Supplier table created successfully.")


if __name__ == "__main__":
    create_supplier_table()