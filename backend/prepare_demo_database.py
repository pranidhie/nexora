"""Prepare the NEXORA database for a public demo deployment."""

from create_admin import create_admin
from init_ci_database import init_ci_database
from seed_ci_database import seed_ci_database


def prepare_demo_database() -> None:
    """Create tables, configure the demo user and seed reference data."""

    print("")
    print("==========================================")
    print("Preparing NEXORA public demo database")
    print("==========================================")

    init_ci_database()
    create_admin()
    seed_ci_database()

    print("")
    print("==========================================")
    print("NEXORA demo database is ready")
    print("==========================================")


if __name__ == "__main__":
    prepare_demo_database()