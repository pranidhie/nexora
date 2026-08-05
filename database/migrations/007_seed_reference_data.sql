-- =========================================================
-- NEXORA
-- Migration: 007_seed_reference_data.sql
-- Purpose: Seed reference/master data
-- Database: PostgreSQL
-- =========================================================

BEGIN;

SET search_path TO procurement, public;

-- =========================================================
-- ITEM CATEGORIES
-- =========================================================

INSERT INTO item_categories
(category_code, category_name, description)
VALUES

('RAW_MATERIAL','Raw Material','Raw materials used in manufacturing'),

('INGREDIENT','Ingredient','Food ingredients'),

('PACKAGING_MATERIAL','Packaging Material','Packaging items'),

('CLEANING_MATERIAL','Cleaning Material','Cleaning chemicals and consumables'),

('MAINTENANCE_ITEM','Maintenance Item','Maintenance parts'),

('NON_STOCK_ITEM','Non Stock Item','Non-stock purchases'),

('SERVICE','Service','External services')

ON CONFLICT (category_code) DO NOTHING;

-- =========================================================
-- UNITS OF MEASURE
-- =========================================================

INSERT INTO units_of_measure
(uom_code,uom_name,uom_type)
VALUES

('EA','Each','COUNT'),
('BOX','Box','PACKAGING'),
('CTN','Carton','PACKAGING'),
('PK','Pack','PACKAGING'),

('KG','Kilogram','WEIGHT'),
('G','Gram','WEIGHT'),
('T','Tonne','WEIGHT'),

('L','Litre','VOLUME'),
('ML','Millilitre','VOLUME')

ON CONFLICT (uom_code) DO NOTHING;

-- =========================================================
-- APPROVAL RULES
-- =========================================================

INSERT INTO approval_rules
(
document_type,
minimum_amount,
maximum_amount,
currency_code,
approval_level,
auto_approve,
active,
effective_from,
created_by,
updated_by
)
SELECT
'PURCHASE_ORDER',
0.00,
999.99,
'AUD',
1,
TRUE,
TRUE,
CURRENT_DATE,
u.user_id,
u.user_id
FROM users u
ORDER BY u.user_id
LIMIT 1;

INSERT INTO approval_rules
(
document_type,
minimum_amount,
maximum_amount,
currency_code,
approval_level,
approver_role_id,
auto_approve,
active,
effective_from,
created_by,
updated_by
)
SELECT
'PURCHASE_ORDER',
1000.00,
NULL,
'AUD',
1,
r.role_id,
FALSE,
TRUE,
CURRENT_DATE,
u.user_id,
u.user_id
FROM roles r
CROSS JOIN
(
SELECT user_id
FROM users
ORDER BY user_id
LIMIT 1
) u
WHERE r.role_code='NOMINATED_APPROVER';

INSERT INTO approval_rules
(
document_type,
minimum_amount,
maximum_amount,
currency_code,
approval_level,
auto_approve,
active,
effective_from,
created_by,
updated_by
)
SELECT
'PURCHASE_REQUISITION',
0.00,
999.99,
'AUD',
1,
TRUE,
TRUE,
CURRENT_DATE,
u.user_id,
u.user_id
FROM users u
ORDER BY u.user_id
LIMIT 1;

INSERT INTO approval_rules
(
document_type,
minimum_amount,
maximum_amount,
currency_code,
approval_level,
approver_role_id,
auto_approve,
active,
effective_from,
created_by,
updated_by
)
SELECT
'PURCHASE_REQUISITION',
1000.00,
NULL,
'AUD',
1,
r.role_id,
FALSE,
TRUE,
CURRENT_DATE,
u.user_id,
u.user_id
FROM roles r
CROSS JOIN
(
SELECT user_id
FROM users
ORDER BY user_id
LIMIT 1
) u
WHERE r.role_code='NOMINATED_APPROVER';

COMMIT;
