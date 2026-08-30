BEGIN;

CREATE SCHEMA IF NOT EXISTS procurement;


-- ============================================================
-- CURRENCY MASTER
-- ============================================================

CREATE TABLE IF NOT EXISTS procurement.currencies (
    currency_id BIGSERIAL PRIMARY KEY,

    currency_code VARCHAR(3) NOT NULL UNIQUE,

    currency_name VARCHAR(100) NOT NULL,

    currency_symbol VARCHAR(10),

    decimal_places INTEGER NOT NULL DEFAULT 2,

    is_base_currency BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- TAX CODE MASTER
-- ============================================================

CREATE TABLE IF NOT EXISTS procurement.tax_codes (
    tax_code_id BIGSERIAL PRIMARY KEY,

    tax_code VARCHAR(30) NOT NULL UNIQUE,

    tax_name VARCHAR(150) NOT NULL,

    tax_rate NUMERIC(7,4) NOT NULL DEFAULT 0,

    tax_type VARCHAR(30) NOT NULL,

    country_code VARCHAR(3),

    recoverable_percentage NUMERIC(7,4)
        NOT NULL DEFAULT 100,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tax_rate
        CHECK (
            tax_rate >= 0
            AND tax_rate <= 100
        ),

    CONSTRAINT chk_recoverable_percentage
        CHECK (
            recoverable_percentage >= 0
            AND recoverable_percentage <= 100
        )
);


-- ============================================================
-- SUPPLIER DEFAULT CURRENCY
-- ============================================================

ALTER TABLE procurement.suppliers
ADD COLUMN IF NOT EXISTS
    default_currency_id BIGINT;


-- ============================================================
-- SUPPLIER ITEM DEFAULT TAX
-- ============================================================

ALTER TABLE procurement.supplier_items
ADD COLUMN IF NOT EXISTS
    tax_code_id BIGINT;


-- ============================================================
-- PURCHASE ORDER HEADER
-- ============================================================

ALTER TABLE procurement.purchase_orders
ADD COLUMN IF NOT EXISTS
    currency_id BIGINT;

ALTER TABLE procurement.purchase_orders
ADD COLUMN IF NOT EXISTS
    exchange_rate NUMERIC(18,8)
    NOT NULL DEFAULT 1.00000000;

ALTER TABLE procurement.purchase_orders
ADD COLUMN IF NOT EXISTS
    base_currency_code VARCHAR(3)
    NOT NULL DEFAULT 'AUD';

ALTER TABLE procurement.purchase_orders
ADD COLUMN IF NOT EXISTS
    base_currency_total NUMERIC(14,2)
    NOT NULL DEFAULT 0;


-- ============================================================
-- PURCHASE ORDER LINE TAX DATA
-- ============================================================

ALTER TABLE procurement.purchase_order_items
ADD COLUMN IF NOT EXISTS
    tax_code_id BIGINT;

ALTER TABLE procurement.purchase_order_items
ADD COLUMN IF NOT EXISTS
    tax_rate NUMERIC(7,4)
    NOT NULL DEFAULT 0;


-- ============================================================
-- FOREIGN KEYS
-- ============================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'fk_supplier_default_currency'
    ) THEN

        ALTER TABLE procurement.suppliers
        ADD CONSTRAINT
            fk_supplier_default_currency
        FOREIGN KEY (
            default_currency_id
        )
        REFERENCES procurement.currencies(
            currency_id
        )
        ON DELETE RESTRICT;

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'fk_supplier_item_tax_code'
    ) THEN

        ALTER TABLE procurement.supplier_items
        ADD CONSTRAINT
            fk_supplier_item_tax_code
        FOREIGN KEY (
            tax_code_id
        )
        REFERENCES procurement.tax_codes(
            tax_code_id
        )
        ON DELETE RESTRICT;

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'fk_po_currency'
    ) THEN

        ALTER TABLE procurement.purchase_orders
        ADD CONSTRAINT
            fk_po_currency
        FOREIGN KEY (
            currency_id
        )
        REFERENCES procurement.currencies(
            currency_id
        )
        ON DELETE RESTRICT;

    END IF;


    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname =
            'fk_po_item_tax_code'
    ) THEN

        ALTER TABLE procurement.purchase_order_items
        ADD CONSTRAINT
            fk_po_item_tax_code
        FOREIGN KEY (
            tax_code_id
        )
        REFERENCES procurement.tax_codes(
            tax_code_id
        )
        ON DELETE RESTRICT;

    END IF;

END $$;


-- ============================================================
-- CURRENCY DATA
-- ============================================================

INSERT INTO procurement.currencies (
    currency_code,
    currency_name,
    currency_symbol,
    decimal_places,
    is_base_currency,
    is_active
)
VALUES
    (
        'AUD',
        'Australian Dollar',
        '$',
        2,
        TRUE,
        TRUE
    ),
    (
        'USD',
        'US Dollar',
        '$',
        2,
        FALSE,
        TRUE
    ),
    (
        'EUR',
        'Euro',
        '€',
        2,
        FALSE,
        TRUE
    ),
    (
        'GBP',
        'British Pound',
        '£',
        2,
        FALSE,
        TRUE
    ),
    (
        'NZD',
        'New Zealand Dollar',
        '$',
        2,
        FALSE,
        TRUE
    ),
    (
        'LKR',
        'Sri Lankan Rupee',
        'Rs',
        2,
        FALSE,
        TRUE
    )
ON CONFLICT (currency_code)
DO NOTHING;


-- ============================================================
-- TAX DATA
-- ============================================================

INSERT INTO procurement.tax_codes (
    tax_code,
    tax_name,
    tax_rate,
    tax_type,
    country_code,
    recoverable_percentage,
    is_active
)
VALUES
    (
        'GST_10',
        'Australian GST 10%',
        10.0000,
        'GST',
        'AUS',
        100.0000,
        TRUE
    ),

    (
        'GST_FREE',
        'GST Free',
        0.0000,
        'GST_FREE',
        'AUS',
        100.0000,
        TRUE
    ),

    (
        'INPUT_TAXED',
        'Input Taxed',
        0.0000,
        'INPUT_TAXED',
        'AUS',
        0.0000,
        TRUE
    ),

    (
        'NO_TAX',
        'No Tax',
        0.0000,
        'NONE',
        NULL,
        0.0000,
        TRUE
    ),

    (
        'IMPORT_GST_10',
        'Import GST 10%',
        10.0000,
        'IMPORT_GST',
        'AUS',
        100.0000,
        TRUE
    )
ON CONFLICT (tax_code)
DO NOTHING;


-- ============================================================
-- EXISTING PO CURRENCY MIGRATION
-- ============================================================

UPDATE procurement.purchase_orders po
SET currency_id = c.currency_id
FROM procurement.currencies c
WHERE
    c.currency_code = po.currency
    AND po.currency_id IS NULL;


COMMIT;