# API Design

## Overview

NexusERP will use REST APIs to connect the React frontend with the FastAPI backend.

Base URL:

```text
/api/v1
```

The first release will support authentication, suppliers, purchase orders, and purchase order items.

---

## Authentication APIs

### Login

```http
POST /api/v1/auth/login
```

Example request:

```json
{
  "email": "manager@nexuserp.com",
  "password": "password123"
}
```

Example response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer"
}
```

### Get Current User

```http
GET /api/v1/auth/me
```

---

## Supplier APIs

### Create Supplier

```http
POST /api/v1/suppliers
```

Example request:

```json
{
  "supplier_code": "SUP-001",
  "supplier_name": "Global Food Supplies",
  "email": "contact@globalfoods.com",
  "phone": "+61 400 000 000",
  "address": "Melbourne, Australia",
  "active": true
}
```

### Get All Suppliers

```http
GET /api/v1/suppliers
```

Optional query parameters:

```text
?page=1
&limit=20
&search=global
&active=true
```

### Get Supplier by ID

```http
GET /api/v1/suppliers/{supplier_id}
```

### Update Supplier

```http
PUT /api/v1/suppliers/{supplier_id}
```

### Deactivate Supplier

```http
PATCH /api/v1/suppliers/{supplier_id}/deactivate
```

---

## Purchase Order APIs

### Create Purchase Order

```http
POST /api/v1/purchase-orders
```

Example request:

```json
{
  "supplier_id": 1,
  "order_date": "2026-07-31",
  "items": [
    {
      "item_name": "Packaging Materials",
      "quantity": 10,
      "unit_price": 25.50
    }
  ]
}
```

### Get All Purchase Orders

```http
GET /api/v1/purchase-orders
```

Optional query parameters:

```text
?page=1
&limit=20
&status=DRAFT
&supplier_id=1
```

### Get Purchase Order by ID

```http
GET /api/v1/purchase-orders/{po_id}
```

### Update Purchase Order

```http
PUT /api/v1/purchase-orders/{po_id}
```

Only purchase orders with the status `DRAFT` or `REJECTED` can be updated.

### Submit Purchase Order

```http
POST /api/v1/purchase-orders/{po_id}/submit
```

### Approve Purchase Order

```http
POST /api/v1/purchase-orders/{po_id}/approve
```

### Reject Purchase Order

```http
POST /api/v1/purchase-orders/{po_id}/reject
```

Example request:

```json
{
  "rejection_reason": "Supplier quotation is incomplete."
}
```

---

## Purchase Order Statuses

```text
DRAFT
SUBMITTED
APPROVED
REJECTED
CANCELLED
```

---

## Standard Success Response

```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "supplier_name",
      "message": "Supplier name is required."
    }
  ]
}
```

---

## HTTP Status Codes

| Status Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Access denied |
| 404 | Resource not found |
| 409 | Duplicate or conflicting data |
| 422 | Validation error |
| 500 | Internal server error |

---

## Future APIs

- Goods receipt APIs
- Inventory APIs
- Invoice APIs
- Notification APIs
- Audit log APIs
- AI test generation APIs
- AI defect analysis APIs
