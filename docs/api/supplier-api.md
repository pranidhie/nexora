# Supplier API Specification

## 1. Purpose

This document defines the REST API contract for Supplier Management in NEXORA.

The Supplier API supports:

- Creating suppliers
- Viewing supplier details
- Searching and filtering suppliers
- Updating supplier information
- Activating, deactivating and placing suppliers on hold
- Managing supplier contacts
- Viewing supplier procurement history

All endpoints use JSON unless otherwise stated.

---

# 2. Base Path

```text
/api/v1/suppliers
```

---

# 3. Authorization

The following roles may access Supplier APIs:

| Operation | Allowed Roles |
|---|---|
| View suppliers | `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Create supplier | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Update supplier | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Change supplier status | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Manage contacts | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |

Every protected request must include:

```http
Authorization: Bearer <access_token>
```

---

# 4. Create Supplier

## Endpoint

```http
POST /api/v1/suppliers
```

## Access

Procurement Officer or System Administrator

## Purpose

Creates a new supplier record.

## Request Body

```json
{
  "supplier_code": "SUP-0001",
  "supplier_name": "Southern Flour Mills",
  "email": "orders@southernflour.com.au",
  "phone": "03 9000 0000",
  "address_line_1": "10 Industry Drive",
  "address_line_2": "Building B",
  "city": "Melbourne",
  "state_region": "VIC",
  "postal_code": "3000",
  "country_code": "AUS",
  "tax_registration_number": "12345678901",
  "payment_terms": "30 Days",
  "notes": "Preferred bulk flour supplier"
}
```

## Validation

- `supplier_code` is mandatory.
- `supplier_name` is mandatory.
- `supplier_code` must be unique.
- Email must use a valid format when provided.
- `country_code` should use a supported ISO-style country code.
- Initial status must be `ACTIVE`.
- Supplier codes should be trimmed and normalised consistently.

## Success Response

```http
201 Created
```

```json
{
  "supplier_id": 3001,
  "supplier_code": "SUP-0001",
  "supplier_name": "Southern Flour Mills",
  "email": "orders@southernflour.com.au",
  "phone": "03 9000 0000",
  "address_line_1": "10 Industry Drive",
  "address_line_2": "Building B",
  "city": "Melbourne",
  "state_region": "VIC",
  "postal_code": "3000",
  "country_code": "AUS",
  "tax_registration_number": "12345678901",
  "payment_terms": "30 Days",
  "status": "ACTIVE",
  "notes": "Preferred bulk flour supplier",
  "created_at": "2026-08-05T15:00:00+10:00",
  "created_by": 1001,
  "updated_at": "2026-08-05T15:00:00+10:00",
  "updated_by": 1001
}
```

## Error Responses

### Duplicate Supplier Code

```http
409 Conflict
```

```json
{
  "error": {
    "code": "SUPPLIER_CODE_EXISTS",
    "message": "A supplier with this supplier code already exists."
  }
}
```

### Validation Failure

```http
422 Unprocessable Entity
```

### Unauthorized

```http
403 Forbidden
```

---

# 5. List and Search Suppliers

## Endpoint

```http
GET /api/v1/suppliers
```

## Access

Authorised procurement users

## Purpose

Returns a paginated list of suppliers.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches Supplier Code and Supplier Name |
| `status` | string | No | Filters by `ACTIVE`, `INACTIVE`, or `ON_HOLD` |
| `city` | string | No | Filters by city or suburb |
| `country_code` | string | No | Filters by country |
| `page` | integer | No | Page number, default `1` |
| `page_size` | integer | No | Records per page, default `20`, maximum `100` |
| `sort_by` | string | No | Field used for sorting |
| `sort_order` | string | No | `asc` or `desc` |

## Example Request

```http
GET /api/v1/suppliers?search=flour&status=ACTIVE&page=1&page_size=20
```

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "supplier_id": 3001,
      "supplier_code": "SUP-0001",
      "supplier_name": "Southern Flour Mills",
      "email": "orders@southernflour.com.au",
      "phone": "03 9000 0000",
      "city": "Melbourne",
      "country_code": "AUS",
      "status": "ACTIVE",
      "primary_contact": {
        "supplier_contact_id": 3101,
        "contact_name": "Alex Morgan",
        "email": "alex@southernflour.com.au"
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

## Validation

- Invalid status filters must be rejected.
- `page` must be greater than zero.
- `page_size` must be between 1 and 100.
- Only supported sorting fields may be accepted.

---

# 6. Get Supplier Details

## Endpoint

```http
GET /api/v1/suppliers/{supplier_id}
```

## Access

Authorised procurement users

## Purpose

Returns full details for one supplier.

## Success Response

```http
200 OK
```

```json
{
  "supplier_id": 3001,
  "supplier_code": "SUP-0001",
  "supplier_name": "Southern Flour Mills",
  "email": "orders@southernflour.com.au",
  "phone": "03 9000 0000",
  "address_line_1": "10 Industry Drive",
  "address_line_2": "Building B",
  "city": "Melbourne",
  "state_region": "VIC",
  "postal_code": "3000",
  "country_code": "AUS",
  "tax_registration_number": "12345678901",
  "payment_terms": "30 Days",
  "status": "ACTIVE",
  "notes": "Preferred bulk flour supplier",
  "contacts": [
    {
      "supplier_contact_id": 3101,
      "contact_name": "Alex Morgan",
      "job_title": "Account Manager",
      "email": "alex@southernflour.com.au",
      "phone": "0400 000 000",
      "primary_contact": true,
      "active": true
    }
  ],
  "created_at": "2026-08-05T15:00:00+10:00",
  "created_by": 1001,
  "updated_at": "2026-08-05T15:00:00+10:00",
  "updated_by": 1001
}
```

## Not Found Response

```http
404 Not Found
```

```json
{
  "error": {
    "code": "SUPPLIER_NOT_FOUND",
    "message": "The requested supplier could not be found."
  }
}
```

---

# 7. Update Supplier

## Endpoint

```http
PATCH /api/v1/suppliers/{supplier_id}
```

## Access

Procurement Officer or System Administrator

## Purpose

Updates permitted supplier information.

## Request Body

```json
{
  "supplier_name": "Southern Flour Mills Australia",
  "email": "procurement@southernflour.com.au",
  "phone": "03 9111 1111",
  "payment_terms": "45 Days",
  "notes": "Updated following contract renewal"
}
```

## Validation

- Only supplied fields are updated.
- `supplier_code` must not be changed to an existing value.
- Email must use a valid format when supplied.
- Status changes should use the dedicated status endpoint.
- The updater and update timestamp must be recorded.
- Significant changes must be written to the audit log.

## Success Response

```http
200 OK
```

Returns the updated supplier object.

## Conflict Response

```http
409 Conflict
```

Returned when a changed supplier code conflicts with an existing record.

---

# 8. Change Supplier Status

## Endpoint

```http
PATCH /api/v1/suppliers/{supplier_id}/status
```

## Access

Procurement Manager or System Administrator

## Purpose

Activates, deactivates or places a supplier on hold.

## Request Body

```json
{
  "status": "INACTIVE",
  "reason": "Supplier contract expired"
}
```

## Allowed Status Values

```text
ACTIVE
INACTIVE
ON_HOLD
```

## Validation

- `reason` is mandatory when changing to `INACTIVE` or `ON_HOLD`.
- Historical transactions must remain available.
- Inactive and on-hold suppliers cannot be selected for new procurement transactions.
- The status change must be audited.

## Success Response

```http
200 OK
```

```json
{
  "supplier_id": 3001,
  "supplier_code": "SUP-0001",
  "status": "INACTIVE",
  "updated_at": "2026-08-05T16:00:00+10:00",
  "updated_by": 1004
}
```

---

# 9. Create Supplier Contact

## Endpoint

```http
POST /api/v1/suppliers/{supplier_id}/contacts
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "contact_name": "Alex Morgan",
  "job_title": "Account Manager",
  "email": "alex@southernflour.com.au",
  "phone": "0400 000 000",
  "primary_contact": true
}
```

## Validation

- `contact_name` is mandatory.
- Email must use a valid format when supplied.
- The supplier must exist.
- Only one active primary contact may exist for a supplier.
- When a new primary contact is assigned, the previous one may be automatically changed to non-primary within the same transaction.

## Success Response

```http
201 Created
```

```json
{
  "supplier_contact_id": 3101,
  "supplier_id": 3001,
  "contact_name": "Alex Morgan",
  "job_title": "Account Manager",
  "email": "alex@southernflour.com.au",
  "phone": "0400 000 000",
  "primary_contact": true,
  "active": true
}
```

---

# 10. Update Supplier Contact

## Endpoint

```http
PATCH /api/v1/suppliers/{supplier_id}/contacts/{contact_id}
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "job_title": "Senior Account Manager",
  "phone": "0400 111 111",
  "primary_contact": true
}
```

## Validation

- The contact must belong to the supplier in the URL.
- Only one active primary contact may exist.
- Contact changes must be audited.

## Success Response

```http
200 OK
```

Returns the updated supplier-contact object.

---

# 11. Change Supplier Contact Status

## Endpoint

```http
PATCH /api/v1/suppliers/{supplier_id}/contacts/{contact_id}/status
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "active": false,
  "reason": "Contact no longer works for supplier"
}
```

## Validation

- The contact must belong to the supplier.
- A reason is mandatory when deactivating a contact.
- A primary contact should not be deactivated without selecting or creating another primary contact where required.
- Historical transaction references must remain intact.

## Success Response

```http
200 OK
```

---

# 12. List Supplier Contacts

## Endpoint

```http
GET /api/v1/suppliers/{supplier_id}/contacts
```

## Access

Authorised procurement users

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `active` | boolean | No | Filters active or inactive contacts |
| `primary_contact` | boolean | No | Filters primary contacts |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "supplier_contact_id": 3101,
      "contact_name": "Alex Morgan",
      "job_title": "Account Manager",
      "email": "alex@southernflour.com.au",
      "phone": "0400 000 000",
      "primary_contact": true,
      "active": true
    }
  ]
}
```

---

# 13. View Supplier Procurement History

## Endpoint

```http
GET /api/v1/suppliers/{supplier_id}/history
```

## Access

Authorised procurement users

## Purpose

Returns procurement activity linked to the supplier.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `entity_type` | string | No | Filters `PURCHASE_ORDER`, `SUPPLIER_ITEM`, or `AUDIT` |
| `date_from` | date | No | Start date |
| `date_to` | date | No | End date |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |

## Success Response

```http
200 OK
```

```json
{
  "supplier_id": 3001,
  "items": [
    {
      "entity_type": "PURCHASE_ORDER",
      "entity_id": 9001,
      "reference_number": "PO-2026-0001",
      "action": "SENT_TO_SUPPLIER",
      "status": "SENT_TO_SUPPLIER",
      "occurred_at": "2026-08-06T11:15:00+10:00"
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

# 14. Supplier Deletion Policy

The Supplier API shall not provide a standard permanent-delete endpoint.

Suppliers with procurement or audit history must be deactivated instead of deleted.

Permanent deletion may only be considered for invalid test records with no dependent data and elevated administrative permission.

---

# 15. Audit Events

The following supplier actions must be auditable:

```text
SUPPLIER_CREATE
SUPPLIER_UPDATE
SUPPLIER_ACTIVATE
SUPPLIER_DEACTIVATE
SUPPLIER_PLACE_ON_HOLD
SUPPLIER_CONTACT_CREATE
SUPPLIER_CONTACT_UPDATE
SUPPLIER_CONTACT_ACTIVATE
SUPPLIER_CONTACT_DEACTIVATE
PRIMARY_CONTACT_CHANGE
```

Audit records should include:

- User ID
- Supplier ID
- Action
- Previous values
- New values
- Reason where applicable
- Date and time
- Request ID

---

# 16. Standard Error Format

```json
{
  "error": {
    "code": "SUPPLIER_NOT_FOUND",
    "message": "The requested supplier could not be found.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
