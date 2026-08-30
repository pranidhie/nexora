-- ============================================================
-- NEXORA PROCUREMENT
-- PHASE 1 BUSINESS RULE HARDENING
-- PostgreSQL
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- CATALOGUE ITEMS
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_catalogue_conversion_factor_positive'
    ) THEN
        ALTER TABLE procurement.catalogue_items
        ADD CONSTRAINT ck_catalogue_conversion_factor_positive
        CHECK (
            conversion_factor IS NULL
            OR conversion_factor > 0
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_catalogue_shelf_life_non_negative'
    ) THEN
        ALTER TABLE procurement.catalogue_items
        ADD CONSTRAINT ck_catalogue_shelf_life_non_negative
        CHECK (
            shelf_life_days IS NULL
            OR shelf_life_days >= 0
        );
    END IF;
END $$;


-- ------------------------------------------------------------
-- SUPPLIER PRICING
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_supplier_item_unit_price_positive'
    ) THEN
        ALTER TABLE procurement.supplier_items
        ADD CONSTRAINT ck_supplier_item_unit_price_positive
        CHECK (unit_price > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_supplier_item_moq_positive'
    ) THEN
        ALTER TABLE procurement.supplier_items
        ADD CONSTRAINT ck_supplier_item_moq_positive
        CHECK (
            minimum_order_quantity IS NULL
            OR minimum_order_quantity > 0
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_supplier_item_lead_time_non_negative'
    ) THEN
        ALTER TABLE procurement.supplier_items
        ADD CONSTRAINT ck_supplier_item_lead_time_non_negative
        CHECK (
            lead_time_days IS NULL
            OR lead_time_days >= 0
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_supplier_item_effective_dates'
    ) THEN
        ALTER TABLE procurement.supplier_items
        ADD CONSTRAINT ck_supplier_item_effective_dates
        CHECK (
            effective_to IS NULL
            OR effective_to >= effective_from
        );
    END IF;
END $$;


-- ------------------------------------------------------------
-- PURCHASE ORDER ITEMS
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_item_quantity_positive'
    ) THEN
        ALTER TABLE procurement.purchase_order_items
        ADD CONSTRAINT ck_po_item_quantity_positive
        CHECK (quantity > 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_item_unit_price_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_order_items
        ADD CONSTRAINT ck_po_item_unit_price_non_negative
        CHECK (unit_price >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_item_tax_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_order_items
        ADD CONSTRAINT ck_po_item_tax_non_negative
        CHECK (tax_amount >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_item_line_total_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_order_items
        ADD CONSTRAINT ck_po_item_line_total_non_negative
        CHECK (line_total >= 0);
    END IF;
END $$;


-- ------------------------------------------------------------
-- PURCHASE ORDER HEADER
-- ------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_subtotal_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_orders
        ADD CONSTRAINT ck_po_subtotal_non_negative
        CHECK (subtotal >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_tax_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_orders
        ADD CONSTRAINT ck_po_tax_non_negative
        CHECK (tax_amount >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_total_non_negative'
    ) THEN
        ALTER TABLE procurement.purchase_orders
        ADD CONSTRAINT ck_po_total_non_negative
        CHECK (total_amount >= 0);
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'procurement'
          AND table_name = 'purchase_orders'
          AND column_name = 'exchange_rate'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_po_exchange_rate_positive'
    ) THEN
        ALTER TABLE procurement.purchase_orders
        ADD CONSTRAINT ck_po_exchange_rate_positive
        CHECK (exchange_rate > 0);
    END IF;
END $$;


-- ------------------------------------------------------------
-- EXCHANGE RATES
-- ------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'procurement'
          AND table_name = 'exchange_rates'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_exchange_rate_positive'
        ) THEN
            ALTER TABLE procurement.exchange_rates
            ADD CONSTRAINT ck_exchange_rate_positive
            CHECK (exchange_rate > 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_exchange_rate_currency_pair'
        ) THEN
            ALTER TABLE procurement.exchange_rates
            ADD CONSTRAINT ck_exchange_rate_currency_pair
            CHECK (
                from_currency_code <> to_currency_code
            );
        END IF;
    END IF;
END $$;


-- ------------------------------------------------------------
-- GOODS RECEIPT ITEMS
-- Existing GRN service already performs cumulative over-receipt
-- validation. These constraints protect individual rows.
-- ------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'procurement'
          AND table_name = 'goods_receipt_items'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_gr_item_received_non_negative'
        ) THEN
            ALTER TABLE procurement.goods_receipt_items
            ADD CONSTRAINT ck_gr_item_received_non_negative
            CHECK (received_quantity >= 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_gr_item_rejected_non_negative'
        ) THEN
            ALTER TABLE procurement.goods_receipt_items
            ADD CONSTRAINT ck_gr_item_rejected_non_negative
            CHECK (rejected_quantity >= 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_gr_item_row_not_over_ordered'
        ) THEN
            ALTER TABLE procurement.goods_receipt_items
            ADD CONSTRAINT ck_gr_item_row_not_over_ordered
            CHECK (
                received_quantity
                + rejected_quantity
                <= ordered_quantity
            );
        END IF;
    END IF;
END $$;


-- ------------------------------------------------------------
-- INVENTORY BALANCES
-- ------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'procurement'
          AND table_name = 'inventory_balances'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_inventory_on_hand_non_negative'
        ) THEN
            ALTER TABLE procurement.inventory_balances
            ADD CONSTRAINT ck_inventory_on_hand_non_negative
            CHECK (quantity_on_hand >= 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_inventory_reserved_non_negative'
        ) THEN
            ALTER TABLE procurement.inventory_balances
            ADD CONSTRAINT ck_inventory_reserved_non_negative
            CHECK (quantity_reserved >= 0);
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'ck_inventory_available_non_negative'
        ) THEN
            ALTER TABLE procurement.inventory_balances
            ADD CONSTRAINT ck_inventory_available_non_negative
            CHECK (quantity_available >= 0);
        END IF;
    END IF;
END $$;

COMMIT;
