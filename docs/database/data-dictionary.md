# NEXORA Procurement Data Dictionary

## 1. Purpose

This document defines the business meaning, validation rules and usage of key data elements within the NEXORA Procurement Management database.

The data dictionary supports:

- consistent terminology
- database implementation
- API development
- UI design
- automated testing
- reporting
- future AI and RAG retrieval

---

# 2. Data Dictionary Standards

## 2.1 Naming

Database fields use `snake_case`.

Examples:

- `supplier_code`
- `purchase_order_id`
- `created_at`

---

## 2.2 Data Classification

Each field may be classified as:

- **Public** — safe for general display
- **Internal** — business information for authorised users
- **Confidential** — restricted business or personal data
- **Sensitive** — authentication or security-related data

---

## 2.3 Required Values

- **Yes** means the field must contain a value.
- **No** means the field may be null.
- Conditional requirements are explained in the validation section.

---

# 3. Security Data

## 3.1 `users`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `user_id` | User ID | Internal unique identifier for a NEXORA user | `1001` | Yes | Internal |
| `first_name` | First Name | User's given name | `Pranidhi` | Yes | Confidential |
| `last_name` | Last Name | User's family name | `Peiris` | Yes | Confidential |
| `email` | Email Address | Unique email used for login and notifications | `pranidhi@example.com` | Yes | Confidential |
| `password_hash` | Password Hash | Secure one-way representation of the password | `$argon2id$...` | Yes | Sensitive |
| `status` | User Status | Current account state | `ACTIVE` | Yes | Internal |
| `last_login_at` | Last Login Time | Date and time of most recent successful login | `2026-08-05 10:30:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the account was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the most recent account update | `2026-08-05 10:00:00+10` | Yes | Internal |

### Validation

- `email` must be unique.
- `email` should be stored in lowercase.
- `status` must be one of:
  - `ACTIVE`
  - `INACTIVE`
  - `LOCKED`
- `password_hash` must never contain a plain-text password.

---

## 3.2 `roles`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `role_id` | Role ID | Internal unique identifier for a role | `5` | Yes | Internal |
| `role_code` | Role Code | Stable system code used by permissions | `PROCUREMENT_OFFICER` | Yes | Internal |
| `role_name` | Role Name | Human-readable role title | `Procurement Officer` | Yes | Public |
| `description` | Role Description | Summary of role responsibilities | `Creates and submits purchase orders` | No | Public |
| `active` | Active Indicator | Indicates whether the role can be assigned | `true` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the role was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the most recent role update | `2026-08-05 09:30:00+10` | Yes | Internal |

### Validation

- `role_code` must be unique.
- `role_name` must be unique.
- Inactive roles cannot be assigned to new users.

---

## 3.3 `user_roles`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `user_role_id` | User Role ID | Unique identifier for a role assignment | `2001` | Yes | Internal |
| `user_id` | User ID | User receiving the role | `1001` | Yes | Internal |
| `role_id` | Role ID | Role assigned to the user | `5` | Yes | Internal |
| `assigned_at` | Assigned Time | Date and time the role was assigned | `2026-08-05 09:15:00+10` | Yes | Internal |
| `assigned_by` | Assigned By | User who assigned the role | `1000` | No | Internal |
| `active` | Active Assignment | Indicates whether the assignment is currently active | `true` | Yes | Internal |

### Validation

- The same active role must not be assigned to a user more than once.
- Historical assignments should be deactivated rather than deleted.

---

# 4. Supplier Data

## 4.1 `suppliers`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `supplier_id` | Supplier ID | Internal unique identifier for a supplier | `3001` | Yes | Internal |
| `supplier_code` | Supplier Code | Unique business code used to identify the supplier | `SUP-0001` | Yes | Internal |
| `supplier_name` | Supplier Name | Registered or trading name | `Southern Flour Mills` | Yes | Public |
| `email` | General Email | Main supplier email address | `orders@southernflour.com.au` | No | Confidential |
| `phone` | General Phone | Main supplier contact number | `03 9000 0000` | No | Confidential |
| `address_line_1` | Address Line 1 | Primary street address | `10 Industry Drive` | No | Confidential |
| `address_line_2` | Address Line 2 | Additional address information | `Building B` | No | Confidential |
| `city` | City or Suburb | Supplier locality | `Melbourne` | No | Confidential |
| `state_region` | State or Region | State, province or region | `VIC` | No | Confidential |
| `postal_code` | Postal Code | Supplier postcode | `3000` | No | Confidential |
| `country_code` | Country Code | ISO country code | `AUS` | No | Internal |
| `tax_registration_number` | Tax Registration Number | ABN or equivalent tax identifier | `12 345 678 901` | No | Confidential |
| `payment_terms` | Payment Terms | Default agreed payment terms | `30 Days` | No | Internal |
| `status` | Supplier Status | Current supplier lifecycle status | `ACTIVE` | Yes | Internal |
| `notes` | Supplier Notes | General internal comments | `Preferred bulk flour supplier` | No | Internal |
| `created_at` | Created Time | Timestamp when the supplier was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the supplier | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 11:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the supplier | `1002` | Yes | Internal |

### Validation

- `supplier_code` must be unique.
- `supplier_name` is mandatory.
- `status` must be one of:
  - `ACTIVE`
  - `INACTIVE`
  - `ON_HOLD`
- Inactive suppliers cannot be selected for new procurement transactions.
- Suppliers with transaction history must not be permanently deleted.

---

## 4.2 `supplier_contacts`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `supplier_contact_id` | Supplier Contact ID | Unique identifier for a supplier contact | `3101` | Yes | Internal |
| `supplier_id` | Supplier ID | Supplier to which the contact belongs | `3001` | Yes | Internal |
| `contact_name` | Contact Name | Contact person's full name | `Alex Morgan` | Yes | Confidential |
| `job_title` | Job Title | Contact's position at the supplier | `Account Manager` | No | Public |
| `email` | Contact Email | Contact's email address | `alex@southernflour.com.au` | No | Confidential |
| `phone` | Contact Phone | Contact's phone number | `0400 000 000` | No | Confidential |
| `primary_contact` | Primary Contact | Indicates the default contact for procurement communication | `true` | Yes | Internal |
| `active` | Active Contact | Indicates whether the contact can be selected | `true` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the contact was created | `2026-08-05 09:10:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the contact | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 10:20:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the contact | `1001` | Yes | Internal |

### Validation

- A supplier may have multiple contacts.
- Only one active primary contact should exist per supplier.
- Email must use a valid format when provided.
- Contacts referenced by historical transactions should not be permanently deleted.

---

# 5. Catalogue Data

## 5.1 `item_categories`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `category_id` | Category ID | Internal unique identifier for an item category | `4001` | Yes | Internal |
| `category_code` | Category Code | Unique category business code | `RAW_MATERIAL` | Yes | Internal |
| `category_name` | Category Name | Human-readable category name | `Raw Material` | Yes | Public |
| `description` | Description | Explanation of the category | `Materials consumed during food production` | No | Public |
| `active` | Active Indicator | Indicates whether new items may use the category | `true` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the category was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 09:00:00+10` | Yes | Internal |

### Validation

- `category_code` must be unique.
- `category_name` must be unique.
- Inactive categories cannot be selected for new items.

---

## 5.2 `units_of_measure`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `uom_id` | Unit ID | Internal unique identifier for a unit of measure | `5001` | Yes | Internal |
| `uom_code` | Unit Code | Short unique unit code | `KG` | Yes | Public |
| `uom_name` | Unit Name | Human-readable unit name | `Kilogram` | Yes | Public |
| `uom_type` | Unit Type | Classification of the unit | `WEIGHT` | No | Internal |
| `active` | Active Indicator | Indicates whether the unit may be selected | `true` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the unit was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 09:00:00+10` | Yes | Internal |

### Example Unit Types

- `WEIGHT`
- `VOLUME`
- `COUNT`
- `PACKAGING`

### Validation

- `uom_code` must be unique.
- `uom_name` must be unique.
- Inactive units cannot be selected for new items or new procurement lines.

---

## 5.3 `catalogue_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `catalogue_item_id` | Catalogue Item ID | Internal identifier for an item | `6001` | Yes | Internal |
| `item_code` | Item Code | Unique business code for the item | `RM-FLOUR-001` | Yes | Internal |
| `item_name` | Item Name | Human-readable item name | `Premium Wheat Flour` | Yes | Public |
| `item_type` | Item Type | Business classification of the item | `RAW_MATERIAL` | Yes | Internal |
| `category_id` | Category ID | Item category | `4001` | Yes | Internal |
| `purchase_uom_id` | Purchase Unit | Default unit used when buying the item | `5006` | Yes | Internal |
| `stock_uom_id` | Stock Unit | Unit used to hold inventory | `5001` | No | Internal |
| `conversion_factor` | Conversion Factor | Quantity of stock units represented by one purchase unit | `20.0000` | Conditional | Internal |
| `shelf_life_days` | Shelf Life | Expected usable life in days | `180` | No | Internal |
| `storage_condition` | Storage Condition | Required storage environment | `Cool and dry area` | No | Internal |
| `batch_tracking_required` | Batch Tracking Required | Indicates whether batch or lot capture is mandatory | `true` | Yes | Internal |
| `expiry_tracking_required` | Expiry Tracking Required | Indicates whether expiry capture is mandatory | `true` | Yes | Internal |
| `allergen_information` | Allergen Information | Food allergen details | `Contains gluten` | No | Confidential |
| `country_of_origin` | Country of Origin | Origin country for the item | `Australia` | No | Internal |
| `status` | Item Status | Current catalogue status | `ACTIVE` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the item was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the item | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 10:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the item | `1002` | Yes | Internal |

### Validation

- `item_code` must be unique.
- `item_name` is mandatory.
- `conversion_factor` is mandatory when purchase and stock units differ.
- `conversion_factor` must be greater than zero.
- `stock_uom_id` may be null for services and authorised non-stock items.
- Only active items may be used in new procurement transactions.

---

# 6. Supplier–Item Data

## 6.1 `supplier_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `supplier_item_id` | Supplier Item ID | Internal identifier for a supplier-item relationship | `7001` | Yes | Internal |
| `supplier_id` | Supplier ID | Supplier providing the item | `3001` | Yes | Internal |
| `catalogue_item_id` | Catalogue Item ID | Item provided by the supplier | `6001` | Yes | Internal |
| `supplier_item_code` | Supplier Item Code | Supplier's own code for the item | `SF-WF-20KG` | No | Internal |
| `purchase_uom_id` | Supplier Purchase Unit | Unit in which the supplier sells the item | `5006` | Yes | Internal |
| `unit_price` | Unit Price | Current supplier purchase price | `42.50` | Yes | Confidential |
| `currency_code` | Currency | Currency used for the supplier price | `AUD` | Yes | Internal |
| `minimum_order_quantity` | Minimum Order Quantity | Minimum quantity allowed by the supplier | `10.0000` | No | Internal |
| `lead_time_days` | Lead Time | Expected delivery time in days | `5` | No | Internal |
| `preferred_supplier` | Preferred Supplier | Indicates whether this is the preferred supplier for the item | `true` | Yes | Internal |
| `effective_from` | Effective From | Date from which the price is valid | `2026-08-01` | Yes | Internal |
| `effective_to` | Effective To | Date on which the price stops being valid | `2026-12-31` | No | Internal |
| `active` | Active Relationship | Indicates whether the supplier-item relationship can be used | `true` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the relationship was created | `2026-08-05 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the relationship | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 10:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the relationship | `1002` | Yes | Internal |

### Validation

- `unit_price` must be zero or greater.
- `minimum_order_quantity` must be greater than zero when provided.
- `lead_time_days` must be zero or greater.
- `effective_to` must not be earlier than `effective_from`.
- Only active suppliers and active catalogue items may be used.
- Only one active preferred supplier should exist per catalogue item at a time.
- Historical prices must remain available after a new price is introduced.

---
# 7. Purchase Requisition Data

## 7.1 `purchase_requisitions`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_id` | Purchase Requisition ID | Internal unique identifier for a requisition | `8001` | Yes | Internal |
| `requisition_number` | Requisition Number | Unique business reference for the requisition | `PR-2026-0001` | Yes | Internal |
| `requested_by` | Requested By | User who requested the goods or services | `1005` | Yes | Internal |
| `department` | Department | Business area requesting the purchase | `Production` | Yes | Internal |
| `required_date` | Required Date | Date by which the request is needed | `2026-08-20` | Yes | Internal |
| `justification` | Business Justification | Reason for the purchase request | `Required for weekly production schedule` | Yes | Internal |
| `estimated_total` | Estimated Total | Estimated total value of the requisition | `2500.00` | Yes | Confidential |
| `currency_code` | Currency | Currency used for the estimated total | `AUD` | Yes | Internal |
| `status` | Requisition Status | Current lifecycle status of the requisition | `PENDING_APPROVAL` | Yes | Internal |
| `submitted_at` | Submitted Time | Date and time the requisition was submitted | `2026-08-05 14:00:00+10` | No | Internal |
| `approved_at` | Approved Time | Date and time the requisition was approved | `2026-08-06 09:30:00+10` | No | Internal |
| `cancelled_at` | Cancelled Time | Date and time the requisition was cancelled | `2026-08-06 10:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the requisition was created | `2026-08-05 12:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the record | `1005` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 14:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the record | `1005` | Yes | Internal |

### Allowed Status Values

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `RETURNED_FOR_AMENDMENT`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `PARTIALLY_CONVERTED`
- `CONVERTED_TO_PO`
- `CLOSED`

### Validation

- `requisition_number` must be unique.
- `required_date` is mandatory.
- `estimated_total` must be zero or greater.
- Only `DRAFT` and `RETURNED_FOR_AMENDMENT` requisitions may be edited.
- Only `APPROVED` requisitions may be converted into Standard Purchase Orders.
- Cancelled requisitions cannot be converted into Purchase Orders.

---

## 7.2 `purchase_requisition_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_item_id` | Requisition Item ID | Internal identifier for a requisition line | `8101` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Parent requisition containing the line | `8001` | Yes | Internal |
| `line_number` | Line Number | Sequential line number within the requisition | `1` | Yes | Internal |
| `catalogue_item_id` | Catalogue Item ID | Requested catalogue item | `6001` | Conditional | Internal |
| `description` | Description | Description of the requested item or service | `Premium Wheat Flour` | Yes | Internal |
| `quantity` | Requested Quantity | Quantity requested | `100.0000` | Yes | Internal |
| `requested_uom_id` | Requested Unit | Unit in which the quantity is requested | `5001` | Yes | Internal |
| `estimated_unit_price` | Estimated Unit Price | Estimated price per requested unit | `2.50` | Yes | Confidential |
| `estimated_line_total` | Estimated Line Total | Quantity multiplied by estimated unit price | `250.00` | Yes | Confidential |
| `required_date` | Line Required Date | Required date for this particular line | `2026-08-20` | No | Internal |
| `non_catalogue_item` | Non-Catalogue Indicator | Indicates whether the request is outside the approved catalogue | `false` | Yes | Internal |
| `converted_quantity` | Converted Quantity | Quantity already converted to Purchase Orders | `50.0000` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the line was created | `2026-08-05 12:05:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the line | `1005` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 12:10:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the line | `1005` | Yes | Internal |

### Validation

- `line_number` must be unique within the requisition.
- `quantity` must be greater than zero.
- `estimated_unit_price` must be zero or greater.
- `estimated_line_total` must equal `quantity × estimated_unit_price`.
- `converted_quantity` must not exceed `quantity`.
- `catalogue_item_id` is mandatory unless `non_catalogue_item = true`.
- Only active catalogue items may be selected for new lines.

---

# 8. Purchase Order Data

## 8.1 `purchase_orders`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_id` | Purchase Order ID | Internal unique identifier for a Purchase Order | `9001` | Yes | Internal |
| `po_number` | Purchase Order Number | Unique business reference for the order | `PO-2026-0001` | Yes | Internal |
| `order_type` | Order Type | Identifies a Standard or Direct Purchase Order | `STANDARD` | Yes | Internal |
| `source_requisition_id` | Source Requisition | Approved requisition used to create a Standard PO | `8001` | Conditional | Internal |
| `supplier_id` | Supplier ID | Supplier receiving the order | `3001` | Yes | Internal |
| `supplier_contact_id` | Supplier Contact ID | Supplier contact receiving the PO | `3101` | No | Confidential |
| `order_date` | Order Date | Business date of the Purchase Order | `2026-08-06` | Yes | Internal |
| `required_delivery_date` | Required Delivery Date | Requested date for supplier delivery | `2026-08-20` | No | Internal |
| `delivery_address` | Delivery Address | Location where the supplier must deliver | `20 Manufacturing Road, Melbourne VIC` | Yes | Confidential |
| `currency_code` | Currency | Currency used on the Purchase Order | `AUD` | Yes | Internal |
| `subtotal` | Subtotal | Total value before tax | `1500.00` | Yes | Confidential |
| `tax_amount` | Tax Amount | Total tax value | `150.00` | Yes | Confidential |
| `total_amount` | Total Amount | Final Purchase Order value | `1650.00` | Yes | Confidential |
| `status` | Purchase Order Status | Current lifecycle status | `PENDING_APPROVAL` | Yes | Internal |
| `revision_number` | Revision Number | Current controlled PO revision | `1` | Yes | Internal |
| `direct_purchase_reason` | Direct Purchase Reason | Business reason for bypassing requisition stage | `Urgent equipment repair` | Conditional | Internal |
| `approval_threshold_applied` | Approval Threshold Applied | Approval threshold used at submission | `1000.00` | No | Internal |
| `submitted_at` | Submitted Time | Date and time the PO was submitted | `2026-08-06 10:00:00+10` | No | Internal |
| `approved_at` | Approved Time | Date and time the PO was approved | `2026-08-06 11:00:00+10` | No | Internal |
| `sent_at` | Sent Time | Date and time the PO was sent to the supplier | `2026-08-06 11:15:00+10` | No | Internal |
| `cancelled_at` | Cancelled Time | Date and time the PO was cancelled | `2026-08-07 09:00:00+10` | No | Internal |
| `closed_at` | Closed Time | Date and time the PO lifecycle ended | `2026-09-01 16:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the PO was created | `2026-08-06 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the PO | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-06 11:15:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the PO | `1001` | Yes | Internal |

### Allowed Order Types

- `STANDARD`
- `DIRECT`

### Allowed Status Values

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `RETURNED_FOR_AMENDMENT`
- `APPROVED`
- `REJECTED`
- `ON_HOLD`
- `CANCELLED`
- `SENT_TO_SUPPLIER`
- `PARTIALLY_RECEIVED`
- `FULLY_RECEIVED`
- `PARTIALLY_INVOICED`
- `FULLY_INVOICED`
- `MATCHING_EXCEPTION`
- `MATCHED`
- `CLOSED`

### Validation

- `po_number` must be unique.
- Monetary amounts must be zero or greater.
- For `STANDARD` orders:
  - `source_requisition_id` is mandatory.
  - `direct_purchase_reason` must be empty.
- For `DIRECT` orders:
  - `source_requisition_id` must be empty.
  - `direct_purchase_reason` is mandatory.
- The selected supplier must be active.
- Approved or Sent Purchase Orders must not be overwritten directly.
- Only Approved Purchase Orders may be issued to suppliers.

---

## 8.2 `purchase_order_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_item_id` | Purchase Order Item ID | Internal identifier for a Purchase Order line | `9101` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Parent Purchase Order | `9001` | Yes | Internal |
| `line_number` | Line Number | Sequential line number within the PO | `1` | Yes | Internal |
| `source_requisition_item_id` | Source Requisition Item | Requisition line used to create the PO line | `8101` | No | Internal |
| `catalogue_item_id` | Catalogue Item ID | Catalogue item being ordered | `6001` | Conditional | Internal |
| `supplier_item_id` | Supplier Item ID | Supplier-specific price and item reference | `7001` | No | Internal |
| `description` | Description | Purchase line description | `Premium Wheat Flour, 20 kg bag` | Yes | Internal |
| `quantity` | Ordered Quantity | Quantity ordered from the supplier | `10.0000` | Yes | Internal |
| `ordered_uom_id` | Ordered Unit | Unit used for the supplier order | `5006` | Yes | Internal |
| `unit_price` | Unit Price | Price per ordered unit | `42.50` | Yes | Confidential |
| `tax_rate` | Tax Rate | Tax percentage applicable to the line | `10.0000` | Yes | Internal |
| `tax_amount` | Tax Amount | Tax calculated for the line | `42.50` | Yes | Confidential |
| `line_total` | Line Total | Total line value based on calculation rules | `467.50` | Yes | Confidential |
| `required_delivery_date` | Required Delivery Date | Required date for the specific line | `2026-08-20` | No | Internal |
| `price_overridden` | Price Overridden | Indicates whether the catalogue price was changed | `true` | Yes | Internal |
| `price_override_reason` | Price Override Reason | Reason for changing the supplier price | `Supplier quotation received` | Conditional | Internal |
| `non_catalogue_item` | Non-Catalogue Indicator | Indicates an authorised free-text purchase line | `false` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the line was created | `2026-08-06 09:05:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the line | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-06 09:20:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the line | `1001` | Yes | Internal |

### Validation

- `line_number` must be unique within each Purchase Order.
- `quantity` must be greater than zero.
- `unit_price`, `tax_amount` and `line_total` must be zero or greater.
- `catalogue_item_id` is mandatory unless `non_catalogue_item = true`.
- `price_override_reason` is mandatory when `price_overridden = true`.
- The selected supplier item must match the PO supplier and catalogue item.
- Converted quantities must not exceed the approved requisition quantity.

---

# 9. Approval Data

## 9.1 `approval_rules`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `approval_rule_id` | Approval Rule ID | Internal unique identifier for an approval rule | `10001` | Yes | Internal |
| `document_type` | Document Type | Procurement document controlled by the rule | `PURCHASE_ORDER` | Yes | Internal |
| `minimum_amount` | Minimum Amount | Inclusive lower value for the rule | `1000.00` | Yes | Confidential |
| `maximum_amount` | Maximum Amount | Inclusive upper value for the rule | `5000.00` | No | Confidential |
| `currency_code` | Currency | Currency in which the limits apply | `AUD` | Yes | Internal |
| `approval_level` | Approval Level | Order in a multi-level approval sequence | `1` | Yes | Internal |
| `approver_user_id` | Nominated Approver | Specific user selected to approve | `1003` | Conditional | Internal |
| `approver_role_id` | Approver Role | Role permitted to approve | `3` | Conditional | Internal |
| `auto_approve` | Auto-Approval Indicator | Indicates whether no human approval is needed | `false` | Yes | Internal |
| `active` | Active Rule | Indicates whether the rule may be applied | `true` | Yes | Internal |
| `effective_from` | Effective From | Date from which the rule applies | `2026-08-01` | Yes | Internal |
| `effective_to` | Effective To | Date on which the rule stops applying | `2026-12-31` | No | Internal |
| `created_at` | Created Time | Timestamp when the rule was created | `2026-08-01 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the rule | `1000` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-01 09:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the rule | `1000` | Yes | Internal |

### Validation

- `minimum_amount` must be zero or greater.
- `maximum_amount` must not be less than `minimum_amount`.
- `approval_level` must be greater than zero.
- A non-auto-approved rule must identify an approver user or approver role.
- Conflicting active amount ranges must be prevented.

---

## 9.2 `purchase_requisition_approvals`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_approval_id` | Requisition Approval ID | Internal identifier for a requisition approval | `10101` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Requisition being reviewed | `8001` | Yes | Internal |
| `approval_rule_id` | Approval Rule ID | Approval rule used for assignment | `10001` | No | Internal |
| `approval_level` | Approval Level | Approval sequence level | `1` | Yes | Internal |
| `approver_id` | Approver ID | User assigned to review the requisition | `1003` | No | Internal |
| `decision` | Decision | Current or completed approval decision | `APPROVED` | Yes | Internal |
| `comments` | Approval Comments | Comments entered by the approver | `Approved for August production` | No | Internal |
| `assigned_at` | Assigned Time | Date and time approval was assigned | `2026-08-05 14:00:00+10` | Yes | Internal |
| `decided_at` | Decision Time | Date and time the decision was recorded | `2026-08-06 09:30:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the approval record was created | `2026-08-05 14:00:00+10` | Yes | Internal |

### Allowed Decisions

- `PENDING`
- `APPROVED`
- `REJECTED`
- `RETURNED_FOR_AMENDMENT`
- `CANCELLED`

### Validation

- A user cannot approve a requisition they created.
- Comments are mandatory for rejection and return decisions.
- `decided_at` is mandatory after a final decision.
- Only one active pending approval should exist for the same requisition and approval level.

---

## 9.3 `purchase_order_approvals`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_approval_id` | PO Approval ID | Internal identifier for a Purchase Order approval | `10201` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Purchase Order being reviewed | `9001` | Yes | Internal |
| `approval_rule_id` | Approval Rule ID | Approval rule applied to the PO | `10001` | No | Internal |
| `approval_level` | Approval Level | Sequence level of the decision | `1` | Yes | Internal |
| `approver_id` | Approver ID | Human approver | `1003` | Conditional | Internal |
| `approval_source` | Approval Source | Indicates user or system approval | `USER` | Yes | Internal |
| `decision` | Decision | Current or completed approval decision | `APPROVED` | Yes | Internal |
| `po_total_at_decision` | PO Total at Decision | Purchase Order value reviewed by the approver | `1650.00` | Yes | Confidential |
| `comments` | Approval Comments | Approver's comments | `Approved within purchasing budget` | No | Internal |
| `assigned_at` | Assigned Time | Time the approval was assigned | `2026-08-06 10:00:00+10` | Yes | Internal |
| `decided_at` | Decision Time | Time the approval decision was made | `2026-08-06 11:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the approval record was created | `2026-08-06 10:00:00+10` | Yes | Internal |

### Allowed Approval Sources

- `SYSTEM`
- `USER`

### Allowed Decisions

- `PENDING`
- `APPROVED`
- `REJECTED`
- `RETURNED_FOR_AMENDMENT`
- `CANCELLED`

### Validation

- `approver_id` is mandatory for user approval.
- `approver_id` must be empty for system auto-approval.
- Users cannot approve their own Purchase Orders.
- Comments are mandatory for rejection and return decisions.
- Material PO amendments require a new approval record.

---

# 10. Status History Data

## 10.1 `purchase_requisition_status_history`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_status_history_id` | Requisition Status History ID | Unique identifier for the history entry | `11001` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Related requisition | `8001` | Yes | Internal |
| `previous_status` | Previous Status | Status before the transition | `SUBMITTED` | No | Internal |
| `new_status` | New Status | Status after the transition | `APPROVED` | Yes | Internal |
| `action` | Action | Action that caused the status change | `APPROVE` | Yes | Internal |
| `comments` | Comments | Reason or comments related to the transition | `Approved for production` | No | Internal |
| `changed_by` | Changed By | User who performed the action | `1003` | Yes | Internal |
| `changed_at` | Changed Time | Date and time of the status change | `2026-08-06 09:30:00+10` | Yes | Internal |

### Validation

- A reason is mandatory for rejection, return and cancellation.
- Status-history records must not be edited or deleted by standard users.
- The document status change and history record must be saved together.

---

## 10.2 `purchase_order_status_history`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_status_history_id` | PO Status History ID | Unique identifier for the PO history entry | `11101` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Related Purchase Order | `9001` | Yes | Internal |
| `revision_number` | Revision Number | PO revision at the time of the change | `1` | Yes | Internal |
| `previous_status` | Previous Status | Status before the transition | `PENDING_APPROVAL` | No | Internal |
| `new_status` | New Status | Status after the transition | `APPROVED` | Yes | Internal |
| `action` | Action | Action that caused the transition | `APPROVE` | Yes | Internal |
| `comments` | Comments | Reason or comments | `Approved by nominated approver` | No | Internal |
| `changed_by` | Changed By | User responsible for the transition | `1003` | Yes | Internal |
| `changed_at` | Changed Time | Date and time of the status transition | `2026-08-06 11:00:00+10` | Yes | Internal |

### Validation

- `revision_number` must be zero or greater.
- A reason is mandatory for rejection, return, hold and cancellation.
- Status-history records are append-only.
- Invalid status transitions must be blocked.

---

# 11. Notification Data

## 11.1 `notifications`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `notification_id` | Notification ID | Internal unique identifier for a notification | `12001` | Yes | Internal |
| `recipient_user_id` | Recipient User | User receiving the notification | `1003` | Yes | Confidential |
| `notification_type` | Notification Type | Business category of the notification | `PO_APPROVAL_REQUIRED` | Yes | Internal |
| `title` | Notification Title | Short notification heading | `Purchase Order Approval Required` | Yes | Internal |
| `message` | Notification Message | Notification details | `PO-2026-0001 requires your approval` | Yes | Internal |
| `related_entity_type` | Related Entity Type | Entity associated with the notification | `PURCHASE_ORDER` | No | Internal |
| `related_entity_id` | Related Entity ID | Identifier of the related record | `9001` | No | Internal |
| `delivery_channel` | Delivery Channel | Channel used to send the notification | `IN_APP` | Yes | Internal |
| `status` | Notification Status | Current delivery or reading status | `SENT` | Yes | Internal |
| `read_at` | Read Time | Time the recipient opened the notification | `2026-08-06 10:15:00+10` | No | Internal |
| `sent_at` | Sent Time | Time the notification was delivered | `2026-08-06 10:00:05+10` | No | Internal |
| `failure_reason` | Failure Reason | Error information for a failed delivery | `Email service unavailable` | Conditional | Internal |
| `created_at` | Created Time | Timestamp when the notification was created | `2026-08-06 10:00:00+10` | Yes | Internal |

### Allowed Delivery Channels

- `IN_APP`
- `EMAIL`

### Allowed Status Values

- `PENDING`
- `SENT`
- `FAILED`
- `READ`

### Validation

- `failure_reason` is mandatory when status is `FAILED`.
- `read_at` should be populated when status becomes `READ`.
- Workflow notifications should not be deleted when they form part of process evidence.

---

# 12. Audit Data

## 12.1 `audit_logs`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `audit_log_id` | Audit Log ID | Unique identifier for an audit entry | `13001` | Yes | Internal |
| `user_id` | User ID | User responsible for the action | `1001` | No | Confidential |
| `entity_type` | Entity Type | Type of business entity affected | `PURCHASE_ORDER` | Yes | Internal |
| `entity_id` | Entity ID | Identifier of the affected record | `9001` | Yes | Internal |
| `action` | Audit Action | Action performed on the entity | `UPDATE` | Yes | Internal |
| `previous_values` | Previous Values | JSON representation of values before the action | `{"unit_price": 40.00}` | No | Confidential |
| `new_values` | New Values | JSON representation of values after the action | `{"unit_price": 42.50}` | No | Confidential |
| `reason` | Business Reason | Reason supplied for the action | `Updated from supplier quotation` | No | Internal |
| `request_id` | Request ID | Correlation ID used to trace an API request | `9a2d5e42-...` | No | Internal |
| `ip_address` | IP Address | Network address from which the action originated | `192.168.1.10` | No | Sensitive |
| `created_at` | Audit Time | Timestamp when the action occurred | `2026-08-06 09:20:00+10` | Yes | Internal |

### Example Actions

- `CREATE`
- `UPDATE`
- `SUBMIT`
- `APPROVE`
- `REJECT`
- `RETURN_FOR_AMENDMENT`
- `RESUBMIT`
- `AUTO_APPROVE`
- `HOLD`
- `RELEASE`
- `AMEND`
- `CANCEL`
- `SEND_TO_SUPPLIER`
- `STATUS_CHANGE`
- `LOGIN`
- `ROLE_ASSIGNMENT`

### Validation

- Audit records must be append-only.
- Standard users must not update or delete audit records.
- Passwords, access tokens and refresh tokens must never be included.
- `user_id` may be empty for valid system-generated actions.
- Sensitive personal information should be excluded unless essential for traceability.

---

# 13. Document Ownership Summary

| Data Area | Primary Business Owner |
|---|---|
| Users and Roles | System Administrator |
| Suppliers | Procurement Officer |
| Supplier Contacts | Procurement Officer |
| Item Catalogue | Procurement Officer and Quality Officer |
| Supplier-Item Catalogue | Procurement Officer |
| Purchase Requisitions | Requesting Employee |
| Purchase Orders | Procurement Officer |
| Approval Rules | Procurement Manager or System Administrator |
| Approval Decisions | Nominated Approver |
| Status History | System Controlled |
| Notifications | System Controlled |
| Audit Logs | System Controlled and Auditor Reviewed |

---

# 14. Future Data Dictionary Extensions

Future phases will add data definitions for:

- Warehouses
- Storage Locations
- Inventory Balances
- Goods Receipts
- Batch and Lot Numbers
- Expiry and Best-Before Dates
- Quality Inspections
- Quarantine and Release
- Supplier Invoices
- Three-Way Matching
- Accounting Integration
- Payment Status
- Production Planning
- Recipes and Bills of Materials

---

# 7. Purchase Requisition Data

## 7.1 `purchase_requisitions`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_id` | Purchase Requisition ID | Internal unique identifier for a requisition | `8001` | Yes | Internal |
| `requisition_number` | Requisition Number | Unique business reference for the requisition | `PR-2026-0001` | Yes | Internal |
| `requested_by` | Requested By | User who requested the goods or services | `1005` | Yes | Internal |
| `department` | Department | Business area requesting the purchase | `Production` | Yes | Internal |
| `required_date` | Required Date | Date by which the request is needed | `2026-08-20` | Yes | Internal |
| `justification` | Business Justification | Reason for the purchase request | `Required for weekly production schedule` | Yes | Internal |
| `estimated_total` | Estimated Total | Estimated total value of the requisition | `2500.00` | Yes | Confidential |
| `currency_code` | Currency | Currency used for the estimated total | `AUD` | Yes | Internal |
| `status` | Requisition Status | Current lifecycle status of the requisition | `PENDING_APPROVAL` | Yes | Internal |
| `submitted_at` | Submitted Time | Date and time the requisition was submitted | `2026-08-05 14:00:00+10` | No | Internal |
| `approved_at` | Approved Time | Date and time the requisition was approved | `2026-08-06 09:30:00+10` | No | Internal |
| `cancelled_at` | Cancelled Time | Date and time the requisition was cancelled | `2026-08-06 10:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the requisition was created | `2026-08-05 12:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the record | `1005` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 14:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the record | `1005` | Yes | Internal |

### Allowed Status Values

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `RETURNED_FOR_AMENDMENT`
- `APPROVED`
- `REJECTED`
- `CANCELLED`
- `PARTIALLY_CONVERTED`
- `CONVERTED_TO_PO`
- `CLOSED`

### Validation

- `requisition_number` must be unique.
- `required_date` is mandatory.
- `estimated_total` must be zero or greater.
- Only `DRAFT` and `RETURNED_FOR_AMENDMENT` requisitions may be edited.
- Only `APPROVED` requisitions may be converted into Standard Purchase Orders.
- Cancelled requisitions cannot be converted into Purchase Orders.

---

## 7.2 `purchase_requisition_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_item_id` | Requisition Item ID | Internal identifier for a requisition line | `8101` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Parent requisition containing the line | `8001` | Yes | Internal |
| `line_number` | Line Number | Sequential line number within the requisition | `1` | Yes | Internal |
| `catalogue_item_id` | Catalogue Item ID | Requested catalogue item | `6001` | Conditional | Internal |
| `description` | Description | Description of the requested item or service | `Premium Wheat Flour` | Yes | Internal |
| `quantity` | Requested Quantity | Quantity requested | `100.0000` | Yes | Internal |
| `requested_uom_id` | Requested Unit | Unit in which the quantity is requested | `5001` | Yes | Internal |
| `estimated_unit_price` | Estimated Unit Price | Estimated price per requested unit | `2.50` | Yes | Confidential |
| `estimated_line_total` | Estimated Line Total | Quantity multiplied by estimated unit price | `250.00` | Yes | Confidential |
| `required_date` | Line Required Date | Required date for this particular line | `2026-08-20` | No | Internal |
| `non_catalogue_item` | Non-Catalogue Indicator | Indicates whether the request is outside the approved catalogue | `false` | Yes | Internal |
| `converted_quantity` | Converted Quantity | Quantity already converted to Purchase Orders | `50.0000` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the line was created | `2026-08-05 12:05:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the line | `1005` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-05 12:10:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the line | `1005` | Yes | Internal |

### Validation

- `line_number` must be unique within the requisition.
- `quantity` must be greater than zero.
- `estimated_unit_price` must be zero or greater.
- `estimated_line_total` must equal `quantity × estimated_unit_price`.
- `converted_quantity` must not exceed `quantity`.
- `catalogue_item_id` is mandatory unless `non_catalogue_item = true`.
- Only active catalogue items may be selected for new lines.

---

# 8. Purchase Order Data

## 8.1 `purchase_orders`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_id` | Purchase Order ID | Internal unique identifier for a Purchase Order | `9001` | Yes | Internal |
| `po_number` | Purchase Order Number | Unique business reference for the order | `PO-2026-0001` | Yes | Internal |
| `order_type` | Order Type | Identifies a Standard or Direct Purchase Order | `STANDARD` | Yes | Internal |
| `source_requisition_id` | Source Requisition | Approved requisition used to create a Standard PO | `8001` | Conditional | Internal |
| `supplier_id` | Supplier ID | Supplier receiving the order | `3001` | Yes | Internal |
| `supplier_contact_id` | Supplier Contact ID | Supplier contact receiving the PO | `3101` | No | Confidential |
| `order_date` | Order Date | Business date of the Purchase Order | `2026-08-06` | Yes | Internal |
| `required_delivery_date` | Required Delivery Date | Requested date for supplier delivery | `2026-08-20` | No | Internal |
| `delivery_address` | Delivery Address | Location where the supplier must deliver | `20 Manufacturing Road, Melbourne VIC` | Yes | Confidential |
| `currency_code` | Currency | Currency used on the Purchase Order | `AUD` | Yes | Internal |
| `subtotal` | Subtotal | Total value before tax | `1500.00` | Yes | Confidential |
| `tax_amount` | Tax Amount | Total tax value | `150.00` | Yes | Confidential |
| `total_amount` | Total Amount | Final Purchase Order value | `1650.00` | Yes | Confidential |
| `status` | Purchase Order Status | Current lifecycle status | `PENDING_APPROVAL` | Yes | Internal |
| `revision_number` | Revision Number | Current controlled PO revision | `1` | Yes | Internal |
| `direct_purchase_reason` | Direct Purchase Reason | Business reason for bypassing requisition stage | `Urgent equipment repair` | Conditional | Internal |
| `approval_threshold_applied` | Approval Threshold Applied | Approval threshold used at submission | `1000.00` | No | Internal |
| `submitted_at` | Submitted Time | Date and time the PO was submitted | `2026-08-06 10:00:00+10` | No | Internal |
| `approved_at` | Approved Time | Date and time the PO was approved | `2026-08-06 11:00:00+10` | No | Internal |
| `sent_at` | Sent Time | Date and time the PO was sent to the supplier | `2026-08-06 11:15:00+10` | No | Internal |
| `cancelled_at` | Cancelled Time | Date and time the PO was cancelled | `2026-08-07 09:00:00+10` | No | Internal |
| `closed_at` | Closed Time | Date and time the PO lifecycle ended | `2026-09-01 16:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the PO was created | `2026-08-06 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the PO | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-06 11:15:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the PO | `1001` | Yes | Internal |

### Allowed Order Types

- `STANDARD`
- `DIRECT`

### Allowed Status Values

- `DRAFT`
- `SUBMITTED`
- `PENDING_APPROVAL`
- `RETURNED_FOR_AMENDMENT`
- `APPROVED`
- `REJECTED`
- `ON_HOLD`
- `CANCELLED`
- `SENT_TO_SUPPLIER`
- `PARTIALLY_RECEIVED`
- `FULLY_RECEIVED`
- `PARTIALLY_INVOICED`
- `FULLY_INVOICED`
- `MATCHING_EXCEPTION`
- `MATCHED`
- `CLOSED`

### Validation

- `po_number` must be unique.
- Monetary amounts must be zero or greater.
- For `STANDARD` orders:
  - `source_requisition_id` is mandatory.
  - `direct_purchase_reason` must be empty.
- For `DIRECT` orders:
  - `source_requisition_id` must be empty.
  - `direct_purchase_reason` is mandatory.
- The selected supplier must be active.
- Approved or Sent Purchase Orders must not be overwritten directly.
- Only Approved Purchase Orders may be issued to suppliers.

---

## 8.2 `purchase_order_items`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_item_id` | Purchase Order Item ID | Internal identifier for a Purchase Order line | `9101` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Parent Purchase Order | `9001` | Yes | Internal |
| `line_number` | Line Number | Sequential line number within the PO | `1` | Yes | Internal |
| `source_requisition_item_id` | Source Requisition Item | Requisition line used to create the PO line | `8101` | No | Internal |
| `catalogue_item_id` | Catalogue Item ID | Catalogue item being ordered | `6001` | Conditional | Internal |
| `supplier_item_id` | Supplier Item ID | Supplier-specific price and item reference | `7001` | No | Internal |
| `description` | Description | Purchase line description | `Premium Wheat Flour, 20 kg bag` | Yes | Internal |
| `quantity` | Ordered Quantity | Quantity ordered from the supplier | `10.0000` | Yes | Internal |
| `ordered_uom_id` | Ordered Unit | Unit used for the supplier order | `5006` | Yes | Internal |
| `unit_price` | Unit Price | Price per ordered unit | `42.50` | Yes | Confidential |
| `tax_rate` | Tax Rate | Tax percentage applicable to the line | `10.0000` | Yes | Internal |
| `tax_amount` | Tax Amount | Tax calculated for the line | `42.50` | Yes | Confidential |
| `line_total` | Line Total | Total line value based on calculation rules | `467.50` | Yes | Confidential |
| `required_delivery_date` | Required Delivery Date | Required date for the specific line | `2026-08-20` | No | Internal |
| `price_overridden` | Price Overridden | Indicates whether the catalogue price was changed | `true` | Yes | Internal |
| `price_override_reason` | Price Override Reason | Reason for changing the supplier price | `Supplier quotation received` | Conditional | Internal |
| `non_catalogue_item` | Non-Catalogue Indicator | Indicates an authorised free-text purchase line | `false` | Yes | Internal |
| `created_at` | Created Time | Timestamp when the line was created | `2026-08-06 09:05:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the line | `1001` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-06 09:20:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the line | `1001` | Yes | Internal |

### Validation

- `line_number` must be unique within each Purchase Order.
- `quantity` must be greater than zero.
- `unit_price`, `tax_amount` and `line_total` must be zero or greater.
- `catalogue_item_id` is mandatory unless `non_catalogue_item = true`.
- `price_override_reason` is mandatory when `price_overridden = true`.
- The selected supplier item must match the PO supplier and catalogue item.
- Converted quantities must not exceed the approved requisition quantity.

---

# 9. Approval Data

## 9.1 `approval_rules`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `approval_rule_id` | Approval Rule ID | Internal unique identifier for an approval rule | `10001` | Yes | Internal |
| `document_type` | Document Type | Procurement document controlled by the rule | `PURCHASE_ORDER` | Yes | Internal |
| `minimum_amount` | Minimum Amount | Inclusive lower value for the rule | `1000.00` | Yes | Confidential |
| `maximum_amount` | Maximum Amount | Inclusive upper value for the rule | `5000.00` | No | Confidential |
| `currency_code` | Currency | Currency in which the limits apply | `AUD` | Yes | Internal |
| `approval_level` | Approval Level | Order in a multi-level approval sequence | `1` | Yes | Internal |
| `approver_user_id` | Nominated Approver | Specific user selected to approve | `1003` | Conditional | Internal |
| `approver_role_id` | Approver Role | Role permitted to approve | `3` | Conditional | Internal |
| `auto_approve` | Auto-Approval Indicator | Indicates whether no human approval is needed | `false` | Yes | Internal |
| `active` | Active Rule | Indicates whether the rule may be applied | `true` | Yes | Internal |
| `effective_from` | Effective From | Date from which the rule applies | `2026-08-01` | Yes | Internal |
| `effective_to` | Effective To | Date on which the rule stops applying | `2026-12-31` | No | Internal |
| `created_at` | Created Time | Timestamp when the rule was created | `2026-08-01 09:00:00+10` | Yes | Internal |
| `created_by` | Created By | User who created the rule | `1000` | Yes | Internal |
| `updated_at` | Updated Time | Timestamp of the latest update | `2026-08-01 09:00:00+10` | Yes | Internal |
| `updated_by` | Updated By | User who last updated the rule | `1000` | Yes | Internal |

### Validation

- `minimum_amount` must be zero or greater.
- `maximum_amount` must not be less than `minimum_amount`.
- `approval_level` must be greater than zero.
- A non-auto-approved rule must identify an approver user or approver role.
- Conflicting active amount ranges must be prevented.

---

## 9.2 `purchase_requisition_approvals`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_approval_id` | Requisition Approval ID | Internal identifier for a requisition approval | `10101` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Requisition being reviewed | `8001` | Yes | Internal |
| `approval_rule_id` | Approval Rule ID | Approval rule used for assignment | `10001` | No | Internal |
| `approval_level` | Approval Level | Approval sequence level | `1` | Yes | Internal |
| `approver_id` | Approver ID | User assigned to review the requisition | `1003` | No | Internal |
| `decision` | Decision | Current or completed approval decision | `APPROVED` | Yes | Internal |
| `comments` | Approval Comments | Comments entered by the approver | `Approved for August production` | No | Internal |
| `assigned_at` | Assigned Time | Date and time approval was assigned | `2026-08-05 14:00:00+10` | Yes | Internal |
| `decided_at` | Decision Time | Date and time the decision was recorded | `2026-08-06 09:30:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the approval record was created | `2026-08-05 14:00:00+10` | Yes | Internal |

### Allowed Decisions

- `PENDING`
- `APPROVED`
- `REJECTED`
- `RETURNED_FOR_AMENDMENT`
- `CANCELLED`

### Validation

- A user cannot approve a requisition they created.
- Comments are mandatory for rejection and return decisions.
- `decided_at` is mandatory after a final decision.
- Only one active pending approval should exist for the same requisition and approval level.

---

## 9.3 `purchase_order_approvals`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_approval_id` | PO Approval ID | Internal identifier for a Purchase Order approval | `10201` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Purchase Order being reviewed | `9001` | Yes | Internal |
| `approval_rule_id` | Approval Rule ID | Approval rule applied to the PO | `10001` | No | Internal |
| `approval_level` | Approval Level | Sequence level of the decision | `1` | Yes | Internal |
| `approver_id` | Approver ID | Human approver | `1003` | Conditional | Internal |
| `approval_source` | Approval Source | Indicates user or system approval | `USER` | Yes | Internal |
| `decision` | Decision | Current or completed approval decision | `APPROVED` | Yes | Internal |
| `po_total_at_decision` | PO Total at Decision | Purchase Order value reviewed by the approver | `1650.00` | Yes | Confidential |
| `comments` | Approval Comments | Approver's comments | `Approved within purchasing budget` | No | Internal |
| `assigned_at` | Assigned Time | Time the approval was assigned | `2026-08-06 10:00:00+10` | Yes | Internal |
| `decided_at` | Decision Time | Time the approval decision was made | `2026-08-06 11:00:00+10` | No | Internal |
| `created_at` | Created Time | Timestamp when the approval record was created | `2026-08-06 10:00:00+10` | Yes | Internal |

### Allowed Approval Sources

- `SYSTEM`
- `USER`

### Allowed Decisions

- `PENDING`
- `APPROVED`
- `REJECTED`
- `RETURNED_FOR_AMENDMENT`
- `CANCELLED`

### Validation

- `approver_id` is mandatory for user approval.
- `approver_id` must be empty for system auto-approval.
- Users cannot approve their own Purchase Orders.
- Comments are mandatory for rejection and return decisions.
- Material PO amendments require a new approval record.

---

# 10. Status History Data

## 10.1 `purchase_requisition_status_history`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_requisition_status_history_id` | Requisition Status History ID | Unique identifier for the history entry | `11001` | Yes | Internal |
| `purchase_requisition_id` | Purchase Requisition ID | Related requisition | `8001` | Yes | Internal |
| `previous_status` | Previous Status | Status before the transition | `SUBMITTED` | No | Internal |
| `new_status` | New Status | Status after the transition | `APPROVED` | Yes | Internal |
| `action` | Action | Action that caused the status change | `APPROVE` | Yes | Internal |
| `comments` | Comments | Reason or comments related to the transition | `Approved for production` | No | Internal |
| `changed_by` | Changed By | User who performed the action | `1003` | Yes | Internal |
| `changed_at` | Changed Time | Date and time of the status change | `2026-08-06 09:30:00+10` | Yes | Internal |

### Validation

- A reason is mandatory for rejection, return and cancellation.
- Status-history records must not be edited or deleted by standard users.
- The document status change and history record must be saved together.

---

## 10.2 `purchase_order_status_history`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `purchase_order_status_history_id` | PO Status History ID | Unique identifier for the PO history entry | `11101` | Yes | Internal |
| `purchase_order_id` | Purchase Order ID | Related Purchase Order | `9001` | Yes | Internal |
| `revision_number` | Revision Number | PO revision at the time of the change | `1` | Yes | Internal |
| `previous_status` | Previous Status | Status before the transition | `PENDING_APPROVAL` | No | Internal |
| `new_status` | New Status | Status after the transition | `APPROVED` | Yes | Internal |
| `action` | Action | Action that caused the transition | `APPROVE` | Yes | Internal |
| `comments` | Comments | Reason or comments | `Approved by nominated approver` | No | Internal |
| `changed_by` | Changed By | User responsible for the transition | `1003` | Yes | Internal |
| `changed_at` | Changed Time | Date and time of the status transition | `2026-08-06 11:00:00+10` | Yes | Internal |

### Validation

- `revision_number` must be zero or greater.
- A reason is mandatory for rejection, return, hold and cancellation.
- Status-history records are append-only.
- Invalid status transitions must be blocked.

---

# 11. Notification Data

## 11.1 `notifications`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `notification_id` | Notification ID | Internal unique identifier for a notification | `12001` | Yes | Internal |
| `recipient_user_id` | Recipient User | User receiving the notification | `1003` | Yes | Confidential |
| `notification_type` | Notification Type | Business category of the notification | `PO_APPROVAL_REQUIRED` | Yes | Internal |
| `title` | Notification Title | Short notification heading | `Purchase Order Approval Required` | Yes | Internal |
| `message` | Notification Message | Notification details | `PO-2026-0001 requires your approval` | Yes | Internal |
| `related_entity_type` | Related Entity Type | Entity associated with the notification | `PURCHASE_ORDER` | No | Internal |
| `related_entity_id` | Related Entity ID | Identifier of the related record | `9001` | No | Internal |
| `delivery_channel` | Delivery Channel | Channel used to send the notification | `IN_APP` | Yes | Internal |
| `status` | Notification Status | Current delivery or reading status | `SENT` | Yes | Internal |
| `read_at` | Read Time | Time the recipient opened the notification | `2026-08-06 10:15:00+10` | No | Internal |
| `sent_at` | Sent Time | Time the notification was delivered | `2026-08-06 10:00:05+10` | No | Internal |
| `failure_reason` | Failure Reason | Error information for a failed delivery | `Email service unavailable` | Conditional | Internal |
| `created_at` | Created Time | Timestamp when the notification was created | `2026-08-06 10:00:00+10` | Yes | Internal |

### Allowed Delivery Channels

- `IN_APP`
- `EMAIL`

### Allowed Status Values

- `PENDING`
- `SENT`
- `FAILED`
- `READ`

### Validation

- `failure_reason` is mandatory when status is `FAILED`.
- `read_at` should be populated when status becomes `READ`.
- Workflow notifications should not be deleted when they form part of process evidence.

---

# 12. Audit Data

## 12.1 `audit_logs`

| Field | Business Name | Description | Example | Required | Classification |
|---|---|---|---|---:|---|
| `audit_log_id` | Audit Log ID | Unique identifier for an audit entry | `13001` | Yes | Internal |
| `user_id` | User ID | User responsible for the action | `1001` | No | Confidential |
| `entity_type` | Entity Type | Type of business entity affected | `PURCHASE_ORDER` | Yes | Internal |
| `entity_id` | Entity ID | Identifier of the affected record | `9001` | Yes | Internal |
| `action` | Audit Action | Action performed on the entity | `UPDATE` | Yes | Internal |
| `previous_values` | Previous Values | JSON representation of values before the action | `{"unit_price": 40.00}` | No | Confidential |
| `new_values` | New Values | JSON representation of values after the action | `{"unit_price": 42.50}` | No | Confidential |
| `reason` | Business Reason | Reason supplied for the action | `Updated from supplier quotation` | No | Internal |
| `request_id` | Request ID | Correlation ID used to trace an API request | `9a2d5e42-...` | No | Internal |
| `ip_address` | IP Address | Network address from which the action originated | `192.168.1.10` | No | Sensitive |
| `created_at` | Audit Time | Timestamp when the action occurred | `2026-08-06 09:20:00+10` | Yes | Internal |

### Example Actions

- `CREATE`
- `UPDATE`
- `SUBMIT`
- `APPROVE`
- `REJECT`
- `RETURN_FOR_AMENDMENT`
- `RESUBMIT`
- `AUTO_APPROVE`
- `HOLD`
- `RELEASE`
- `AMEND`
- `CANCEL`
- `SEND_TO_SUPPLIER`
- `STATUS_CHANGE`
- `LOGIN`
- `ROLE_ASSIGNMENT`

### Validation

- Audit records must be append-only.
- Standard users must not update or delete audit records.
- Passwords, access tokens and refresh tokens must never be included.
- `user_id` may be empty for valid system-generated actions.
- Sensitive personal information should be excluded unless essential for traceability.

---

# 13. Document Ownership Summary

| Data Area | Primary Business Owner |
|---|---|
| Users and Roles | System Administrator |
| Suppliers | Procurement Officer |
| Supplier Contacts | Procurement Officer |
| Item Catalogue | Procurement Officer and Quality Officer |
| Supplier-Item Catalogue | Procurement Officer |
| Purchase Requisitions | Requesting Employee |
| Purchase Orders | Procurement Officer |
| Approval Rules | Procurement Manager or System Administrator |
| Approval Decisions | Nominated Approver |
| Status History | System Controlled |
| Notifications | System Controlled |
| Audit Logs | System Controlled and Auditor Reviewed |

---

# 14. Future Data Dictionary Extensions

Future phases will add data definitions for:

- Warehouses
- Storage Locations
- Inventory Balances
- Goods Receipts
- Batch and Lot Numbers
- Expiry and Best-Before Dates
- Quality Inspections
- Quarantine and Release
- Supplier Invoices
- Three-Way Matching
- Accounting Integration
- Payment Status
- Production Planning
- Recipes and Bills of Materials
