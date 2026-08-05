# Catalogue API Specification

## 1. Purpose

This document defines the REST API contract for Catalogue Management in NEXORA.

The Catalogue API supports:

- Item categories
- Units of measure
- Catalogue items
- Food-related material attributes
- Supplier-item relationships
- Supplier-specific pricing
- Preferred suppliers
- Search and filtering

All endpoints use JSON unless otherwise stated.

---

# 2. Base Paths

```text
/api/v1/item-categories
/api/v1/units-of-measure
/api/v1/catalogue-items
/api/v1/supplier-items
```

---

# 3. Authorization

| Operation | Allowed Roles |
|---|---|
| View catalogue data | `REQUESTER`, `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `NOMINATED_APPROVER`, `SYSTEM_ADMINISTRATOR` |
| Create or update categories | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Create or update units | `SYSTEM_ADMINISTRATOR` |
| Create or update catalogue items | `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Maintain supplier-item records | `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Change catalogue status | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

---

# 4. Create Item Category

## Endpoint

```http
POST /api/v1/item-categories
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "category_code": "RAW_MATERIAL",
  "category_name": "Raw Material",
  "description": "Materials used during food production"
}
```

## Validation

- `category_code` is mandatory.
- `category_name` is mandatory.
- `category_code` must be unique.
- `category_name` must be unique.
- New categories default to `active = true`.

## Success Response

```http
201 Created
```

```json
{
  "category_id": 4001,
  "category_code": "RAW_MATERIAL",
  "category_name": "Raw Material",
  "description": "Materials used during food production",
  "active": true
}
```

## Error Responses

### Duplicate Category

```http
409 Conflict
```

```json
{
  "error": {
    "code": "CATEGORY_EXISTS",
    "message": "An item category with this code or name already exists."
  }
}
```

---

# 5. List Item Categories

## Endpoint

```http
GET /api/v1/item-categories
```

## Access

Authenticated users with catalogue access

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches category code and name |
| `active` | boolean | No | Filters active or inactive categories |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "category_id": 4001,
      "category_code": "RAW_MATERIAL",
      "category_name": "Raw Material",
      "description": "Materials used during food production",
      "active": true
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

---

# 6. Update Item Category

## Endpoint

```http
PATCH /api/v1/item-categories/{category_id}
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "category_name": "Production Raw Material",
  "description": "Materials consumed during manufacturing"
}
```

## Validation

- Only supplied fields are updated.
- Duplicate codes and names must be rejected.
- Category status changes should use the dedicated status endpoint.
- Changes must be audited.

## Success Response

```http
200 OK
```

---

# 7. Change Item Category Status

## Endpoint

```http
PATCH /api/v1/item-categories/{category_id}/status
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "active": false,
  "reason": "Category replaced by a new classification"
}
```

## Validation

- A reason is mandatory when deactivating.
- Inactive categories cannot be assigned to new catalogue items.
- Existing item relationships remain valid.

---

# 8. Create Unit of Measure

## Endpoint

```http
POST /api/v1/units-of-measure
```

## Access

System Administrator

## Request Body

```json
{
  "uom_code": "KG",
  "uom_name": "Kilogram",
  "uom_type": "WEIGHT"
}
```

## Allowed Unit Types

```text
WEIGHT
VOLUME
COUNT
PACKAGING
```

## Validation

- `uom_code` is mandatory and unique.
- `uom_name` is mandatory and unique.
- `uom_type`, when provided, must use an allowed value.
- New units default to `active = true`.

## Success Response

```http
201 Created
```

```json
{
  "uom_id": 5001,
  "uom_code": "KG",
  "uom_name": "Kilogram",
  "uom_type": "WEIGHT",
  "active": true
}
```

---

# 9. List Units of Measure

## Endpoint

```http
GET /api/v1/units-of-measure
```

## Access

Authenticated users with catalogue access

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches code and name |
| `uom_type` | string | No | Filters by unit type |
| `active` | boolean | No | Filters active state |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |

## Success Response

```http
200 OK
```

---

# 10. Update Unit of Measure

## Endpoint

```http
PATCH /api/v1/units-of-measure/{uom_id}
```

## Access

System Administrator

## Validation

- Duplicate code and name values must be rejected.
- Changes affecting existing procurement records must be controlled.
- Existing historical records must remain valid.
- Changes must be audited.

---

# 11. Change Unit Status

## Endpoint

```http
PATCH /api/v1/units-of-measure/{uom_id}/status
```

## Access

System Administrator

## Request Body

```json
{
  "active": false,
  "reason": "Unit no longer used"
}
```

## Validation

- A reason is mandatory when deactivating.
- Inactive units cannot be selected for new catalogue items or procurement lines.
- Existing transaction records must remain valid.

---

# 12. Create Catalogue Item

## Endpoint

```http
POST /api/v1/catalogue-items
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "item_code": "RM-FLOUR-001",
  "item_name": "Premium Wheat Flour",
  "item_type": "RAW_MATERIAL",
  "category_id": 4001,
  "purchase_uom_id": 5006,
  "stock_uom_id": 5001,
  "conversion_factor": 20.0,
  "shelf_life_days": 180,
  "storage_condition": "Store in a cool and dry area",
  "batch_tracking_required": true,
  "expiry_tracking_required": true,
  "allergen_information": "Contains gluten",
  "country_of_origin": "Australia"
}
```

## Allowed Item Types

```text
RAW_MATERIAL
INGREDIENT
PACKAGING_MATERIAL
CLEANING_MATERIAL
MAINTENANCE_ITEM
NON_STOCK_ITEM
SERVICE
```

## Validation

- `item_code` is mandatory and unique.
- `item_name` is mandatory.
- `item_type` is mandatory.
- `category_id` must reference an active category.
- `purchase_uom_id` must reference an active unit.
- `stock_uom_id` is required for stock-controlled items.
- `conversion_factor` is required when purchase and stock units differ.
- `conversion_factor` must be greater than zero.
- `shelf_life_days` must be zero or greater when supplied.
- New items default to `ACTIVE`.

## Success Response

```http
201 Created
```

```json
{
  "catalogue_item_id": 6001,
  "item_code": "RM-FLOUR-001",
  "item_name": "Premium Wheat Flour",
  "item_type": "RAW_MATERIAL",
  "category": {
    "category_id": 4001,
    "category_code": "RAW_MATERIAL",
    "category_name": "Raw Material"
  },
  "purchase_uom": {
    "uom_id": 5006,
    "uom_code": "BAG",
    "uom_name": "Bag"
  },
  "stock_uom": {
    "uom_id": 5001,
    "uom_code": "KG",
    "uom_name": "Kilogram"
  },
  "conversion_factor": 20.0,
  "shelf_life_days": 180,
  "storage_condition": "Store in a cool and dry area",
  "batch_tracking_required": true,
  "expiry_tracking_required": true,
  "allergen_information": "Contains gluten",
  "country_of_origin": "Australia",
  "status": "ACTIVE",
  "created_at": "2026-08-05T16:00:00+10:00",
  "created_by": 1001
}
```

## Error Responses

### Duplicate Item Code

```http
409 Conflict
```

```json
{
  "error": {
    "code": "ITEM_CODE_EXISTS",
    "message": "A catalogue item with this item code already exists."
  }
}
```

---

# 13. List and Search Catalogue Items

## Endpoint

```http
GET /api/v1/catalogue-items
```

## Access

Authenticated users with catalogue access

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches item code and item name |
| `item_type` | string | No | Filters by item type |
| `category_id` | integer | No | Filters by category |
| `status` | string | No | Filters `ACTIVE` or `INACTIVE` |
| `batch_tracking_required` | boolean | No | Filters batch-controlled items |
| `expiry_tracking_required` | boolean | No | Filters expiry-controlled items |
| `preferred_supplier_id` | integer | No | Filters items linked to a preferred supplier |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |
| `sort_by` | string | No | Supported sorting field |
| `sort_order` | string | No | `asc` or `desc` |

## Example Request

```http
GET /api/v1/catalogue-items?item_type=RAW_MATERIAL&status=ACTIVE&page=1&page_size=20
```

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "catalogue_item_id": 6001,
      "item_code": "RM-FLOUR-001",
      "item_name": "Premium Wheat Flour",
      "item_type": "RAW_MATERIAL",
      "category_name": "Raw Material",
      "purchase_uom_code": "BAG",
      "stock_uom_code": "KG",
      "batch_tracking_required": true,
      "expiry_tracking_required": true,
      "status": "ACTIVE",
      "preferred_supplier": {
        "supplier_id": 3001,
        "supplier_code": "SUP-0001",
        "supplier_name": "Southern Flour Mills"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

---

# 14. Get Catalogue Item Details

## Endpoint

```http
GET /api/v1/catalogue-items/{catalogue_item_id}
```

## Access

Authenticated users with catalogue access

## Purpose

Returns full item details and active supplier-item relationships.

## Success Response

```http
200 OK
```

```json
{
  "catalogue_item_id": 6001,
  "item_code": "RM-FLOUR-001",
  "item_name": "Premium Wheat Flour",
  "item_type": "RAW_MATERIAL",
  "category": {
    "category_id": 4001,
    "category_code": "RAW_MATERIAL",
    "category_name": "Raw Material"
  },
  "purchase_uom": {
    "uom_id": 5006,
    "uom_code": "BAG",
    "uom_name": "Bag"
  },
  "stock_uom": {
    "uom_id": 5001,
    "uom_code": "KG",
    "uom_name": "Kilogram"
  },
  "conversion_factor": 20.0,
  "shelf_life_days": 180,
  "storage_condition": "Store in a cool and dry area",
  "batch_tracking_required": true,
  "expiry_tracking_required": true,
  "allergen_information": "Contains gluten",
  "country_of_origin": "Australia",
  "status": "ACTIVE",
  "supplier_items": [
    {
      "supplier_item_id": 7001,
      "supplier_id": 3001,
      "supplier_code": "SUP-0001",
      "supplier_name": "Southern Flour Mills",
      "supplier_item_code": "SF-WF-20KG",
      "purchase_uom_code": "BAG",
      "unit_price": 42.5,
      "currency_code": "AUD",
      "minimum_order_quantity": 10,
      "lead_time_days": 5,
      "preferred_supplier": true,
      "active": true
    }
  ]
}
```

## Not Found Response

```http
404 Not Found
```

```json
{
  "error": {
    "code": "CATALOGUE_ITEM_NOT_FOUND",
    "message": "The requested catalogue item could not be found."
  }
}
```

---

# 15. Update Catalogue Item

## Endpoint

```http
PATCH /api/v1/catalogue-items/{catalogue_item_id}
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "item_name": "Premium Australian Wheat Flour",
  "shelf_life_days": 210,
  "storage_condition": "Store below 25 degrees Celsius",
  "allergen_information": "Contains wheat and gluten"
}
```

## Validation

- Only supplied fields are updated.
- `item_code` must not conflict with another item.
- Category and units must be active.
- Conversion factor rules must remain valid.
- Status changes must use the dedicated status endpoint.
- Food-safety attribute changes must be audited.

## Success Response

```http
200 OK
```

Returns the updated catalogue item.

---

# 16. Change Catalogue Item Status

## Endpoint

```http
PATCH /api/v1/catalogue-items/{catalogue_item_id}/status
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "status": "INACTIVE",
  "reason": "Item replaced by a new specification"
}
```

## Validation

- Allowed statuses are `ACTIVE` and `INACTIVE`.
- A reason is mandatory when deactivating.
- Inactive items cannot be added to new requisitions or Purchase Orders.
- Historical procurement records remain available.
- Status changes must be audited.

---

# 17. Create Supplier-Item Relationship

## Endpoint

```http
POST /api/v1/supplier-items
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "supplier_id": 3001,
  "catalogue_item_id": 6001,
  "supplier_item_code": "SF-WF-20KG",
  "purchase_uom_id": 5006,
  "unit_price": 42.5,
  "currency_code": "AUD",
  "minimum_order_quantity": 10,
  "lead_time_days": 5,
  "preferred_supplier": true,
  "effective_from": "2026-08-01",
  "effective_to": null
}
```

## Validation

- Supplier must exist and be `ACTIVE`.
- Catalogue item must exist and be `ACTIVE`.
- Purchase unit must exist and be active.
- `unit_price` must be zero or greater.
- `minimum_order_quantity` must be greater than zero when supplied.
- `lead_time_days` must be zero or greater.
- `effective_to` must not be before `effective_from`.
- Overlapping active price periods must be prevented.
- Only one active preferred supplier may exist per item at a time.

## Success Response

```http
201 Created
```

```json
{
  "supplier_item_id": 7001,
  "supplier_id": 3001,
  "catalogue_item_id": 6001,
  "supplier_item_code": "SF-WF-20KG",
  "purchase_uom_id": 5006,
  "unit_price": 42.5,
  "currency_code": "AUD",
  "minimum_order_quantity": 10,
  "lead_time_days": 5,
  "preferred_supplier": true,
  "effective_from": "2026-08-01",
  "effective_to": null,
  "active": true
}
```

---

# 18. List Supplier-Item Relationships

## Endpoint

```http
GET /api/v1/supplier-items
```

## Access

Authenticated users with catalogue access

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `supplier_id` | integer | No | Filters by supplier |
| `catalogue_item_id` | integer | No | Filters by item |
| `preferred_supplier` | boolean | No | Filters preferred relationships |
| `active` | boolean | No | Filters active state |
| `effective_on` | date | No | Returns pricing valid on a date |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |

## Success Response

```http
200 OK
```

---

# 19. Get Supplier-Item Details

## Endpoint

```http
GET /api/v1/supplier-items/{supplier_item_id}
```

## Access

Authenticated users with catalogue access

## Success Response

```http
200 OK
```

Returns the complete supplier-item record with supplier, item and unit details.

---

# 20. Update Supplier-Item Relationship

## Endpoint

```http
PATCH /api/v1/supplier-items/{supplier_item_id}
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "supplier_item_code": "SF-WF-PREMIUM-20KG",
  "minimum_order_quantity": 15,
  "lead_time_days": 7
}
```

## Validation

- Supplier and item identities should not normally be changed after transactions exist.
- Updated values must satisfy standard supplier-item validation.
- Changes must be audited.

---

# 21. Create New Supplier Price

## Endpoint

```http
POST /api/v1/supplier-items/{supplier_item_id}/prices
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Purpose

Closes the current supplier price period and creates a new historical price record.

## Request Body

```json
{
  "unit_price": 45.75,
  "currency_code": "AUD",
  "effective_from": "2026-09-01",
  "reason": "Annual supplier price increase"
}
```

## Validation

- New price must be zero or greater.
- `effective_from` must be after the start of the existing price record.
- The previous open-ended record should be closed on the day before the new price begins.
- Historical price records must not be overwritten.
- The change must be audited.

## Success Response

```http
201 Created
```

Returns the newly created supplier-item price record.

---

# 22. Set Preferred Supplier

## Endpoint

```http
POST /api/v1/catalogue-items/{catalogue_item_id}/preferred-supplier
```

## Access

Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "supplier_item_id": 7001,
  "reason": "Best approved commercial and quality terms"
}
```

## Validation

- Supplier-item record must belong to the catalogue item.
- Supplier-item record must be active and currently effective.
- Existing preferred supplier must be changed within the same database transaction.
- The change must be audited.

## Success Response

```http
200 OK
```

```json
{
  "catalogue_item_id": 6001,
  "preferred_supplier_item_id": 7001,
  "updated_at": "2026-08-05T17:00:00+10:00"
}
```

---

# 23. Change Supplier-Item Status

## Endpoint

```http
PATCH /api/v1/supplier-items/{supplier_item_id}/status
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "active": false,
  "reason": "Supplier no longer approved for this material"
}
```

## Validation

- A reason is mandatory when deactivating.
- Inactive supplier-item records cannot be selected for new Purchase Orders.
- Historical transactions and price history remain available.
- If the relationship is preferred, another preferred supplier should be selected where required.

---

# 24. Catalogue Deletion Policy

The Catalogue API shall not provide standard permanent-delete endpoints for:

- Categories
- Units of measure
- Catalogue items
- Supplier-item relationships

Records with transaction history must be deactivated instead of deleted.

---

# 25. Audit Events

The following actions must be auditable:

```text
ITEM_CATEGORY_CREATE
ITEM_CATEGORY_UPDATE
ITEM_CATEGORY_ACTIVATE
ITEM_CATEGORY_DEACTIVATE

UOM_CREATE
UOM_UPDATE
UOM_ACTIVATE
UOM_DEACTIVATE

CATALOGUE_ITEM_CREATE
CATALOGUE_ITEM_UPDATE
CATALOGUE_ITEM_ACTIVATE
CATALOGUE_ITEM_DEACTIVATE
FOOD_ATTRIBUTE_UPDATE

SUPPLIER_ITEM_CREATE
SUPPLIER_ITEM_UPDATE
SUPPLIER_ITEM_ACTIVATE
SUPPLIER_ITEM_DEACTIVATE
SUPPLIER_PRICE_CHANGE
PREFERRED_SUPPLIER_CHANGE
```

---

# 26. Standard Error Format

```json
{
  "error": {
    "code": "CATALOGUE_ITEM_NOT_FOUND",
    "message": "The requested catalogue item could not be found.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
