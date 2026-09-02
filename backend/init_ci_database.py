from importlib import import_module

from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine


# ============================================================
# NEXORA CI DATABASE INITIALIZER
# ============================================================
#
# GitHub Actions creates a fresh PostgreSQL database for every
# CI run.
#
# The purpose of this script is to build that database directly
# from the CURRENT SQLAlchemy models instead of relying on older
# SQL DDL migrations that may no longer match the application.
#
# Importing each model module registers its tables with the
# shared Base.metadata object.
# ============================================================


MODEL_MODULES = [
    "app.models.user",
    "app.models.role",
    "app.models.user_role",
    "app.models.supplier",
    "app.models.catalogue",
    "app.models.purchase_request",
    "app.models.purchase_request_item",
    "app.models.purchase_order",
    "app.models.purchase_order_item",
    "app.models.approval",
    "app.models.document_status_history",
    "app.models.goods_receipt",
    "app.models.goods_receipt_item",
    "app.models.inventory",
    "app.models.warehouse",
    "app.models.tax_currency",
]


def register_models() -> None:
    """
    Import all NEXORA SQLAlchemy model modules.

    Importing the modules causes their model classes to register
    themselves with the shared Base.metadata instance.
    """

    print("")
    print("==============================================")
    print("Registering NEXORA SQLAlchemy models")
    print("==============================================")

    for module_name in MODEL_MODULES:
        import_module(module_name)
        print(f"Registered: {module_name}")


def create_procurement_schema() -> None:
    """
    Create the PostgreSQL procurement schema before SQLAlchemy
    attempts to create schema-qualified tables.
    """

    print("")
    print("==============================================")
    print("Creating procurement schema")
    print("==============================================")

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE SCHEMA IF NOT EXISTS procurement"
            )
        )

    print("Schema ready: procurement")


def create_database_tables() -> None:
    """
    Create all tables registered in Base.metadata.

    SQLAlchemy automatically determines the appropriate table
    creation order based on foreign-key dependencies.
    """

    print("")
    print("==============================================")
    print("Creating NEXORA database tables")
    print("==============================================")

    Base.metadata.create_all(
        bind=engine,
        checkfirst=True,
    )

    print("")
    print("Registered tables:")
    print("----------------------------------------------")

    tables = sorted(
        Base.metadata.tables.values(),
        key=lambda table: (
            table.schema or "",
            table.name,
        ),
    )

    for table in tables:
        if table.schema:
            table_name = (
                f"{table.schema}.{table.name}"
            )
        else:
            table_name = table.name

        print(f"  - {table_name}")

    print("----------------------------------------------")
    print(f"Total tables: {len(tables)}")


def verify_critical_tables() -> None:
    """
    Verify that the tables that previously failed in CI now
    exist in the procurement schema.
    """

    print("")
    print("==============================================")
    print("Verifying critical NEXORA tables")
    print("==============================================")

    required_tables = [
        "suppliers",
        "purchase_orders",
        "approvals",
    ]

    with engine.connect() as connection:
        for table_name in required_tables:
            exists = connection.execute(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'procurement'
                        AND table_name = :table_name
                    )
                    """
                ),
                {
                    "table_name": table_name,
                },
            ).scalar()

            if not exists:
                raise RuntimeError(
                    "Required CI table was not created: "
                    f"procurement.{table_name}"
                )

            print(
                "Verified: "
                f"procurement.{table_name}"
            )


def init_ci_database() -> None:
    """
    Build the complete NEXORA CI database schema.
    """

    print("")
    print("##############################################")
    print("# NEXORA CI DATABASE INITIALIZATION")
    print("##############################################")

    register_models()

    create_procurement_schema()

    create_database_tables()

    verify_critical_tables()

    print("")
    print("##############################################")
    print("# NEXORA CI DATABASE READY")
    print("##############################################")
    print("")


if __name__ == "__main__":
    init_ci_database()