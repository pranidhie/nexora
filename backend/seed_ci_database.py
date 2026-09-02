from sqlalchemy import text

from app.db.session import engine


ADMIN_EMAIL = "admin@nexora.com"

SUPPLIER_CODE = "SUP-104"
CATALOGUE_ITEM_CODE = "RM-MILKPOWDER-001"


def seed_ci_database() -> None:
    print("")
    print("##############################################")
    print("# NEXORA CI REFERENCE DATA SEED")
    print("##############################################")
    print("")

    with engine.begin() as connection:
        # ====================================================
        # ADMIN USER
        # ====================================================

        admin_user_id = connection.execute(
            text(
                """
                SELECT user_id
                FROM procurement.users
                WHERE email = :email
                """
            ),
            {
                "email": ADMIN_EMAIL,
            },
        ).scalar_one_or_none()

        if admin_user_id is None:
            raise RuntimeError(
                "NEXORA admin user does not exist. "
                "Run create_admin.py before seed_ci_database.py."
            )

        print(
            f"Admin user ready: "
            f"{ADMIN_EMAIL} (ID {admin_user_id})"
        )

        # ====================================================
        # SUPPLIER
        # ====================================================

        supplier_id = connection.execute(
            text(
                """
                SELECT supplier_id
                FROM procurement.suppliers
                WHERE supplier_code = :supplier_code
                """
            ),
            {
                "supplier_code": SUPPLIER_CODE,
            },
        ).scalar_one_or_none()

        if supplier_id is None:
            supplier_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.suppliers (
                        supplier_code,
                        supplier_name,
                        contact_name,
                        email,
                        phone,
                        address,
                        payment_terms,
                        is_active,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :supplier_code,
                        :supplier_name,
                        :contact_name,
                        :email,
                        :phone,
                        :address,
                        :payment_terms,
                        TRUE,
                        NOW(),
                        NOW()
                    )
                    RETURNING supplier_id
                    """
                ),
                {
                    "supplier_code": SUPPLIER_CODE,
                    "supplier_name": (
                        "Victorian Food Ingredients"
                    ),
                    "contact_name": (
                        "NEXORA CI Procurement"
                    ),
                    "email": (
                        "procurement-ci@example.com"
                    ),
                    "phone": "0390000000",
                    "address": (
                        "Melbourne VIC Australia"
                    ),
                    "payment_terms": "NET30",
                },
            ).scalar_one()

        print(
            f"Supplier ready: "
            f"{SUPPLIER_CODE} (ID {supplier_id})"
        )

        # ====================================================
        # ITEM CATEGORY
        # ====================================================

        category_code = "RAW-MATERIAL"

        category_id = connection.execute(
            text(
                """
                SELECT category_id
                FROM procurement.item_categories
                WHERE category_code = :category_code
                """
            ),
            {
                "category_code": category_code,
            },
        ).scalar_one_or_none()

        if category_id is None:
            category_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.item_categories (
                        category_code,
                        category_name,
                        description,
                        active,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :category_code,
                        :category_name,
                        :description,
                        TRUE,
                        NOW(),
                        NOW()
                    )
                    RETURNING category_id
                    """
                ),
                {
                    "category_code": category_code,
                    "category_name": "Raw Materials",
                    "description": (
                        "NEXORA CI raw material category"
                    ),
                },
            ).scalar_one()

        print(
            f"Category ready: "
            f"{category_code} (ID {category_id})"
        )

        # ====================================================
        # UNIT OF MEASURE — KG
        # ====================================================

        kg_uom_id = connection.execute(
            text(
                """
                SELECT uom_id
                FROM procurement.units_of_measure
                WHERE uom_code = 'KG'
                """
            )
        ).scalar_one_or_none()

        if kg_uom_id is None:
            kg_uom_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.units_of_measure (
                        uom_code,
                        uom_name,
                        uom_type,
                        active,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        'KG',
                        'Kilogram',
                        'WEIGHT',
                        TRUE,
                        NOW(),
                        NOW()
                    )
                    RETURNING uom_id
                    """
                )
            ).scalar_one()

        print(
            f"UOM ready: KG (ID {kg_uom_id})"
        )

        # ====================================================
        # ADDITIONAL COMMON UOMS
        # ====================================================

        additional_uoms = [
            ("EA", "Each", "COUNT"),
            ("BOX", "Box", "PACKAGING"),
            ("CTN", "Carton", "PACKAGING"),
            ("PK", "Pack", "PACKAGING"),
            ("G", "Gram", "WEIGHT"),
            ("T", "Tonne", "WEIGHT"),
            ("L", "Litre", "VOLUME"),
            ("ML", "Millilitre", "VOLUME"),
        ]

        for uom_code, uom_name, uom_type in additional_uoms:
            exists = connection.execute(
                text(
                    """
                    SELECT uom_id
                    FROM procurement.units_of_measure
                    WHERE uom_code = :uom_code
                    """
                ),
                {
                    "uom_code": uom_code,
                },
            ).scalar_one_or_none()

            if exists is None:
                connection.execute(
                    text(
                        """
                        INSERT INTO procurement.units_of_measure (
                            uom_code,
                            uom_name,
                            uom_type,
                            active,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            :uom_code,
                            :uom_name,
                            :uom_type,
                            TRUE,
                            NOW(),
                            NOW()
                        )
                        """
                    ),
                    {
                        "uom_code": uom_code,
                        "uom_name": uom_name,
                        "uom_type": uom_type,
                    },
                )

        print("Common units of measure ready.")

        # ====================================================
        # CATALOGUE ITEM
        # ====================================================

        catalogue_item_id = connection.execute(
            text(
                """
                SELECT catalogue_item_id
                FROM procurement.catalogue_items
                WHERE item_code = :item_code
                """
            ),
            {
                "item_code": CATALOGUE_ITEM_CODE,
            },
        ).scalar_one_or_none()

        if catalogue_item_id is None:
            catalogue_item_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.catalogue_items (
                        item_code,
                        item_name,
                        item_type,
                        category_id,
                        purchase_uom_id,
                        stock_uom_id,
                        conversion_factor,
                        shelf_life_days,
                        storage_condition,
                        batch_tracking_required,
                        expiry_tracking_required,
                        allergen_information,
                        country_of_origin,
                        status,
                        created_at,
                        created_by,
                        updated_at,
                        updated_by
                    )
                    VALUES (
                        :item_code,
                        :item_name,
                        'RAW_MATERIAL',
                        :category_id,
                        :purchase_uom_id,
                        :stock_uom_id,
                        1.0000,
                        NULL,
                        'Dry ambient storage',
                        FALSE,
                        FALSE,
                        NULL,
                        'Australia',
                        'ACTIVE',
                        NOW(),
                        :created_by,
                        NOW(),
                        :updated_by
                    )
                    RETURNING catalogue_item_id
                    """
                ),
                {
                    "item_code": CATALOGUE_ITEM_CODE,
                    "item_name": "Skim Milk Powder",
                    "category_id": category_id,
                    "purchase_uom_id": kg_uom_id,
                    "stock_uom_id": kg_uom_id,
                    "created_by": admin_user_id,
                    "updated_by": admin_user_id,
                },
            ).scalar_one()

        print(
            f"Catalogue item ready: "
            f"{CATALOGUE_ITEM_CODE} "
            f"(ID {catalogue_item_id})"
        )

        # ====================================================
        # SUPPLIER PRICING
        # ====================================================

        supplier_item_id = connection.execute(
            text(
                """
                SELECT supplier_item_id
                FROM procurement.supplier_items
                WHERE supplier_id = :supplier_id
                AND catalogue_item_id = :catalogue_item_id
                AND active IS TRUE
                ORDER BY supplier_item_id
                LIMIT 1
                """
            ),
            {
                "supplier_id": supplier_id,
                "catalogue_item_id": catalogue_item_id,
            },
        ).scalar_one_or_none()

        if supplier_item_id is None:
            supplier_item_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.supplier_items (
                        supplier_id,
                        catalogue_item_id,
                        supplier_item_code,
                        purchase_uom_id,
                        unit_price,
                        currency_code,
                        minimum_order_quantity,
                        lead_time_days,
                        preferred_supplier,
                        effective_from,
                        effective_to,
                        active,
                        created_at,
                        created_by,
                        updated_at,
                        updated_by
                    )
                    VALUES (
                        :supplier_id,
                        :catalogue_item_id,
                        'VFI-MILK-01',
                        :purchase_uom_id,
                        8.75,
                        'AUD',
                        25.0000,
                        4,
                        TRUE,
                        DATE '2026-08-20',
                        NULL,
                        TRUE,
                        NOW(),
                        :created_by,
                        NOW(),
                        :updated_by
                    )
                    RETURNING supplier_item_id
                    """
                ),
                {
                    "supplier_id": supplier_id,
                    "catalogue_item_id": catalogue_item_id,
                    "purchase_uom_id": kg_uom_id,
                    "created_by": admin_user_id,
                    "updated_by": admin_user_id,
                },
            ).scalar_one()

        print(
            f"Supplier pricing ready: "
            f"VFI-MILK-01 (ID {supplier_item_id})"
        )

        # ====================================================
        # AUD CURRENCY
        # ====================================================

        currency_id = connection.execute(
            text(
                """
                SELECT currency_id
                FROM procurement.currencies
                WHERE currency_code = 'AUD'
                """
            )
        ).scalar_one_or_none()

        if currency_id is None:
            currency_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.currencies (
                        currency_code,
                        currency_name,
                        currency_symbol,
                        decimal_places,
                        is_base_currency,
                        is_active
                    )
                    VALUES (
                        'AUD',
                        'Australian Dollar',
                        '$',
                        2,
                        TRUE,
                        TRUE
                    )
                    RETURNING currency_id
                    """
                )
            ).scalar_one()

        print(
            f"Currency ready: AUD (ID {currency_id})"
        )

        # ====================================================
        # GST TAX CODE
        # ====================================================

        tax_code_id = connection.execute(
            text(
                """
                SELECT tax_code_id
                FROM procurement.tax_codes
                WHERE tax_code = 'GST'
                """
            )
        ).scalar_one_or_none()

        if tax_code_id is None:
            tax_code_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.tax_codes (
                        tax_code,
                        tax_name,
                        tax_rate,
                        tax_type,
                        country_code,
                        recoverable_percentage,
                        is_active
                    )
                    VALUES (
                        'GST',
                        'Goods and Services Tax',
                        10.0000,
                        'GST',
                        'AUS',
                        100.0000,
                        TRUE
                    )
                    RETURNING tax_code_id
                    """
                )
            ).scalar_one()

        print(
            f"Tax code ready: GST (ID {tax_code_id})"
        )

        # ====================================================
        # RAW MATERIAL WAREHOUSE
        # ====================================================

        warehouse_code = "MEL-RM-01"

        warehouse_id = connection.execute(
            text(
                """
                SELECT warehouse_id
                FROM procurement.warehouses
                WHERE warehouse_code = :warehouse_code
                """
            ),
            {
                "warehouse_code": warehouse_code,
            },
        ).scalar_one_or_none()

        if warehouse_id is None:
            warehouse_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.warehouses (
                        warehouse_code,
                        warehouse_name,
                        warehouse_type,
                        address,
                        city,
                        state,
                        postcode,
                        country,
                        is_active,
                        created_by,
                        updated_by
                    )
                    VALUES (
                        :warehouse_code,
                        'Melbourne Raw Materials Warehouse',
                        'RAW_MATERIAL',
                        '1 NEXORA Way',
                        'Melbourne',
                        'Victoria',
                        '3000',
                        'Australia',
                        TRUE,
                        :created_by,
                        :updated_by
                    )
                    RETURNING warehouse_id
                    """
                ),
                {
                    "warehouse_code": warehouse_code,
                    "created_by": admin_user_id,
                    "updated_by": admin_user_id,
                },
            ).scalar_one()

        print(
            f"Warehouse ready: "
            f"{warehouse_code} (ID {warehouse_id})"
        )

        # ====================================================
        # RECEIVING LOCATION
        # ====================================================

        location_code = "RECV-01"

        receiving_location_id = connection.execute(
            text(
                """
                SELECT warehouse_location_id
                FROM procurement.warehouse_locations
                WHERE warehouse_id = :warehouse_id
                AND location_code = :location_code
                """
            ),
            {
                "warehouse_id": warehouse_id,
                "location_code": location_code,
            },
        ).scalar_one_or_none()

        if receiving_location_id is None:
            receiving_location_id = connection.execute(
                text(
                    """
                    INSERT INTO procurement.warehouse_locations (
                        warehouse_id,
                        location_code,
                        location_name,
                        location_type,
                        aisle,
                        rack,
                        bin,
                        is_receiving_location,
                        is_quarantine_location,
                        is_active,
                        created_by,
                        updated_by
                    )
                    VALUES (
                        :warehouse_id,
                        :location_code,
                        'Raw Materials Receiving',
                        'RECEIVING',
                        NULL,
                        NULL,
                        NULL,
                        TRUE,
                        FALSE,
                        TRUE,
                        :created_by,
                        :updated_by
                    )
                    RETURNING warehouse_location_id
                    """
                ),
                {
                    "warehouse_id": warehouse_id,
                    "location_code": location_code,
                    "created_by": admin_user_id,
                    "updated_by": admin_user_id,
                },
            ).scalar_one()

        print(
            f"Receiving location ready: "
            f"{location_code} "
            f"(ID {receiving_location_id})"
        )

    print("")
    print("##############################################")
    print("# NEXORA CI REFERENCE DATA READY")
    print("##############################################")
    print("")


if __name__ == "__main__":
    seed_ci_database()