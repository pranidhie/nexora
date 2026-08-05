# Purchase Order API Specification

## 1. Purpose

This document defines the REST API contract for Purchase Order Management in NEXORA.

The Purchase Order API supports:

- Creating Standard Purchase Orders from approved Purchase Requisitions
- Creating Direct Purchase Orders
- Adding and updating Purchase Order lines
- Applying supplier-item prices
- Submitting Purchase Orders
- Auto-approval and manual approval
- Rejecting and returning Purchase Orders
- Sending approved Purchase Orders to suppliers
- Controlled amendments
- Holding, releasing, cancelling and closing Purchase Orders
- Searching Purchase Orders
- Viewing approval, status and revision history

All endpoints use JSON unless otherwise stated.

---

# 2. Base Path

```text
/api/v1/purchase-orders
```

---

# 3. Authorization

| Operation | Allowed Roles |
|---|---|
| View Purchase Orders | `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `NOMINATED_APPROVER`, `SYSTEM_ADMINISTRATOR` |
| Create Standard PO | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Create Direct PO | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Edit Draft or Returned PO | Original Procurement Officer or `SYSTEM_ADMINISTRATOR` |
| Submit PO | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Approve, reject or return PO | Assigned `NOMINATED_APPROVER` or `SYSTEM_ADMINISTRATOR` |
| Send PO to supplier | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |
| Amend approved PO | Authorised `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, or `SYSTEM_ADMINISTRATOR` |
| Place on hold or release | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Cancel PO | Authorised Procurement user or `SYSTEM_ADMINISTRATOR` |

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

---

# 4. Purchase Order Types

```text
STANDARD
DIRECT
```

A Standard Purchase Order must reference an approved Purchase Requisition.

A Direct Purchase Order does not require a Purchase Requisition, but it must include a direct-purchase reason.

---

# 5. Purchase Order Statuses

```text
DRAFT
SUBMITTED
PENDING_APPROVAL
RETURNED_FOR_AMENDMENT
APPROVED
REJECTED
ON_HOLD
CANCELLED
SENT_TO_SUPPLIER
PARTIALLY_RECEIVED
FULLY_RECEIVED
PARTIALLY_INVOICED
FULLY_INVOICED
MATCHING_EXCEPTION
MATCHED
CLOSED
```

The API must reject invalid status transitions.

---

# 6. Create Standard Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/standard
```

## Access

Procurement Officer or System Administrator

## Purpose

Creates a Standard Purchase Order from an approved Purchase Requisition.

## Request Body

```json
{
  "source_requisition_id": 8001,
  "supplier_id": 3001,
  "supplier_contact_id": 3101,
  "required_delivery_date": "2026-08-20",
  "delivery_address": "20 Manufacturing Road, Melbourne VIC",
  "currency_code": "AUD",
  "items": [
    {
      "source_requisition_item_id": 8101,
      "supplier_item_id": 7001,
      "quantity": 10.0,
      "ordered_uom_id": 5006,
      "unit_price": 42.5,
      "tax_rate": 10.0,
      "required_delivery_date": "2026-08-20"
    }
  ]
}
```

## Validation

- `source_requisition_id` must reference an `APPROVED` or `PARTIALLY_CONVERTED` requisition.
- Supplier must be `ACTIVE`.
- Supplier contact, when provided, must belong to the selected supplier.
- At least one line is required.
- Each selected requisition line must belong to the source requisition.
- Converted quantity must not exceed the remaining approved quantity.
- Supplier-item record must match the supplier and catalogue item.
- Quantity must be greater than zero.
- Unit price and tax rate must be zero or greater.
- Purchase Order totals must be calculated by the server.
- The system must generate a unique PO number.
- Initial status must be `DRAFT`.
- `order_type` must be `STANDARD`.

## Success Response

```http
201 Created
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "order_type": "STANDARD",
  "source_requisition_id": 8001,
  "supplier": {
    "supplier_id": 3001,
    "supplier_code": "SUP-0001",
    "supplier_name": "Southern Flour Mills"
  },
  "supplier_contact": {
    "supplier_contact_id": 3101,
    "contact_name": "Alex Morgan",
    "email": "alex@southernflour.com.au"
  },
  "order_date": "2026-08-06",
  "required_delivery_date": "2026-08-20",
  "delivery_address": "20 Manufacturing Road, Melbourne VIC",
  "currency_code": "AUD",
  "subtotal": 425.0,
  "tax_amount": 42.5,
  "total_amount": 467.5,
  "status": "DRAFT",
  "revision_number": 0,
  "items": [
    {
      "purchase_order_item_id": 9101,
      "line_number": 1,
      "source_requisition_item_id": 8101,
      "catalogue_item_id": 6001,
      "supplier_item_id": 7001,
      "description": "Premium Wheat Flour, 20 kg bag",
      "quantity": 10.0,
      "ordered_uom_id": 5006,
      "unit_price": 42.5,
      "tax_rate": 10.0,
      "tax_amount": 42.5,
      "line_total": 467.5
    }
  ],
  "created_at": "2026-08-06T09:00:00+10:00",
  "created_by": 1001
}
```

---

# 7. Create Direct Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/direct
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "direct_purchase_reason": "Urgent replacement part required to avoid production downtime",
  "supplier_id": 3002,
  "supplier_contact_id": 3201,
  "required_delivery_date": "2026-08-08",
  "delivery_address": "20 Manufacturing Road, Melbourne VIC",
  "currency_code": "AUD",
  "items": [
    {
      "catalogue_item_id": 6005,
      "supplier_item_id": 7005,
      "description": "Conveyor belt replacement part",
      "quantity": 1.0,
      "ordered_uom_id": 5002,
      "unit_price": 850.0,
      "tax_rate": 10.0,
      "non_catalogue_item": false
    }
  ]
}
```

## Validation

- `direct_purchase_reason` is mandatory.
- Supplier and catalogue validations are the same as for Standard POs.
- No source requisition may be linked.
- `order_type` must be `DIRECT`.
- The Direct PO must follow the same approval threshold as a Standard PO.
- The system must generate a unique PO number.

## Success Response

```http
201 Created
```

Returns the created Purchase Order with:

```json
{
  "order_type": "DIRECT",
  "source_requisition_id": null,
  "direct_purchase_reason": "Urgent replacement part required to avoid production downtime",
  "status": "DRAFT"
}
```

---

# 8. List and Search Purchase Orders

## Endpoint

```http
GET /api/v1/purchase-orders
```

## Access

Authorised procurement users

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches PO number, supplier name and supplier code |
| `order_type` | string | No | Filters `STANDARD` or `DIRECT` |
| `status` | string | No | Filters by PO status |
| `supplier_id` | integer | No | Filters by supplier |
| `created_by` | integer | No | Filters by creator |
| `source_requisition_id` | integer | No | Filters by source requisition |
| `order_date_from` | date | No | Minimum order date |
| `order_date_to` | date | No | Maximum order date |
| `delivery_date_from` | date | No | Minimum required delivery date |
| `delivery_date_to` | date | No | Maximum required delivery date |
| `minimum_amount` | decimal | No | Minimum PO total |
| `maximum_amount` | decimal | No | Maximum PO total |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Page size, maximum `100` |
| `sort_by` | string | No | Supported sorting field |
| `sort_order` | string | No | `asc` or `desc` |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "purchase_order_id": 9001,
      "po_number": "PO-2026-0001",
      "order_type": "STANDARD",
      "supplier_code": "SUP-0001",
      "supplier_name": "Southern Flour Mills",
      "order_date": "2026-08-06",
      "required_delivery_date": "2026-08-20",
      "total_amount": 1650.0,
      "currency_code": "AUD",
      "status": "PENDING_APPROVAL",
      "revision_number": 0,
      "created_by": {
        "user_id": 1001,
        "first_name": "Alex",
        "last_name": "Morgan"
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

# 9. Get Purchase Order Details

## Endpoint

```http
GET /api/v1/purchase-orders/{purchase_order_id}
```

## Access

Authorised procurement users

## Purpose

Returns the PO header, lines, supplier, approvals, status history and source requisition details.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "order_type": "STANDARD",
  "source_requisition": {
    "purchase_requisition_id": 8001,
    "requisition_number": "PR-2026-0001"
  },
  "supplier": {
    "supplier_id": 3001,
    "supplier_code": "SUP-0001",
    "supplier_name": "Southern Flour Mills"
  },
  "supplier_contact": {
    "supplier_contact_id": 3101,
    "contact_name": "Alex Morgan",
    "email": "alex@southernflour.com.au"
  },
  "order_date": "2026-08-06",
  "required_delivery_date": "2026-08-20",
  "delivery_address": "20 Manufacturing Road, Melbourne VIC",
  "currency_code": "AUD",
  "subtotal": 1500.0,
  "tax_amount": 150.0,
  "total_amount": 1650.0,
  "status": "PENDING_APPROVAL",
  "revision_number": 0,
  "approval_threshold_applied": 1000.0,
  "items": [
    {
      "purchase_order_item_id": 9101,
      "line_number": 1,
      "catalogue_item": {
        "catalogue_item_id": 6001,
        "item_code": "RM-FLOUR-001",
        "item_name": "Premium Wheat Flour"
      },
      "supplier_item_id": 7001,
      "description": "Premium Wheat Flour, 20 kg bag",
      "quantity": 10.0,
      "ordered_uom": {
        "uom_id": 5006,
        "uom_code": "BAG",
        "uom_name": "Bag"
      },
      "unit_price": 150.0,
      "tax_rate": 10.0,
      "tax_amount": 150.0,
      "line_total": 1650.0,
      "price_overridden": false
    }
  ],
  "approvals": [
    {
      "approval_level": 1,
      "approval_source": "USER",
      "approver_id": 1003,
      "decision": "PENDING",
      "assigned_at": "2026-08-06T10:00:00+10:00"
    }
  ],
  "status_history": [
    {
      "revision_number": 0,
      "previous_status": "DRAFT",
      "new_status": "PENDING_APPROVAL",
      "action": "SUBMIT",
      "changed_at": "2026-08-06T10:00:00+10:00"
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
    "code": "PURCHASE_ORDER_NOT_FOUND",
    "message": "The requested Purchase Order could not be found."
  }
}
```

---

# 10. Update Purchase Order Header

## Endpoint

```http
PATCH /api/v1/purchase-orders/{purchase_order_id}
```

## Access

Original Procurement Officer or System Administrator

## Request Body

```json
{
  "supplier_contact_id": 3102,
  "required_delivery_date": "2026-08-22",
  "delivery_address": "Warehouse 2, 20 Manufacturing Road, Melbourne VIC"
}
```

## Validation

- Only `DRAFT` and `RETURNED_FOR_AMENDMENT` POs may be edited.
- Status changes must use workflow endpoints.
- Supplier contact must belong to the selected supplier.
- Changes must be audited.
- Totals must be recalculated when relevant.

## Invalid Status Response

```http
409 Conflict
```

```json
{
  "error": {
    "code": "PURCHASE_ORDER_NOT_EDITABLE",
    "message": "Only Draft or Returned for Amendment Purchase Orders can be edited."
  }
}
```

---

# 11. Add Purchase Order Item

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/items
```

## Access

Original Procurement Officer or System Administrator

## Request Body

```json
{
  "source_requisition_item_id": 8102,
  "catalogue_item_id": 6002,
  "supplier_item_id": 7002,
  "description": "Food-grade packaging film",
  "quantity": 20.0,
  "ordered_uom_id": 5003,
  "unit_price": 18.0,
  "tax_rate": 10.0,
  "required_delivery_date": "2026-08-20",
  "non_catalogue_item": false
}
```

## Validation

- PO must be `DRAFT` or `RETURNED_FOR_AMENDMENT`.
- Standard PO source-line rules must be enforced.
- Supplier-item relationship must match the selected supplier and item.
- Quantity must be greater than zero.
- Price and tax must be zero or greater.
- Minimum-order quantity must be satisfied.
- Line and PO totals must be recalculated.
- The operation must be audited.

## Success Response

```http
201 Created
```

Returns the created line and updated PO totals.

---

# 12. Update Purchase Order Item

## Endpoint

```http
PATCH /api/v1/purchase-orders/{purchase_order_id}/items/{purchase_order_item_id}
```

## Access

Original Procurement Officer or System Administrator

## Request Body

```json
{
  "quantity": 25.0,
  "unit_price": 17.5,
  "price_override_reason": "Supplier quotation dated 6 August 2026"
}
```

## Validation

- PO must be editable.
- The line must belong to the PO.
- Quantity and price rules must be satisfied.
- When the supplied price differs from the active supplier price:
  - `price_overridden` must be set to `true`
  - an authorised user must perform the action
  - `price_override_reason` is mandatory
- Totals must be recalculated.
- Changes must be audited.

---

# 13. Remove Purchase Order Item

## Endpoint

```http
DELETE /api/v1/purchase-orders/{purchase_order_id}/items/{purchase_order_item_id}
```

## Access

Original Procurement Officer or System Administrator

## Validation

- PO must be editable.
- Item must belong to the PO.
- At least one line must remain before submission.
- Requisition conversion quantities must be adjusted for Standard POs.
- PO totals must be recalculated.
- Removal must be audited.

## Success Response

```http
204 No Content
```

---

# 14. Recalculate Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/recalculate
```

## Access

Original Procurement Officer or System Administrator

## Purpose

Recalculates line tax, line totals, subtotal, tax and final total.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "subtotal": 1500.0,
  "tax_amount": 150.0,
  "total_amount": 1650.0
}
```

The server calculation is authoritative.

---

# 15. Submit Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/submit
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "comments": "Submitted following supplier quotation review"
}
```

## Validation

- PO must be `DRAFT` or `RETURNED_FOR_AMENDMENT`.
- At least one valid line must exist.
- Supplier and items must remain active.
- All quantities and prices must be valid.
- Minimum order quantities must be satisfied.
- Required information must be complete.
- Totals must be recalculated.
- Approval rules must be evaluated.
- Self-approval must be prevented for human approval.

## Auto-Approval Behaviour

When total is below the active threshold:

```text
DRAFT or RETURNED_FOR_AMENDMENT
→ APPROVED
```

The system must create a PO approval record with:

```text
approval_source = SYSTEM
decision = APPROVED
```

## Manual Approval Behaviour

When total is at or above the threshold:

```text
DRAFT or RETURNED_FOR_AMENDMENT
→ PENDING_APPROVAL
```

The system must assign the nominated approver.

## Transaction Requirements

The API must update or create:

- PO status
- approval record
- `submitted_at`
- `approved_at`, when auto-approved
- status history
- approver or creator notification
- audit log

within one transaction.

## Success Response — Pending Approval

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "PENDING_APPROVAL",
  "approval_threshold_applied": 1000.0,
  "approval": {
    "approval_source": "USER",
    "approval_level": 1,
    "approver_id": 1003,
    "decision": "PENDING"
  }
}
```

## Success Response — Auto Approved

```http
200 OK
```

```json
{
  "purchase_order_id": 9002,
  "po_number": "PO-2026-0002",
  "status": "APPROVED",
  "approval_threshold_applied": 1000.0,
  "approval": {
    "approval_source": "SYSTEM",
    "approval_level": 1,
    "approver_id": null,
    "decision": "APPROVED"
  }
}
```

---

# 16. Approve Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/approve
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "comments": "Approved within delegated authority"
}
```

## Validation

- PO must be `PENDING_APPROVAL`.
- Current user must be the assigned approver or authorised by the assigned role.
- Approver must not be the PO creator.
- Pending approval must not have already been decided.
- PO total must still match the value submitted for approval.
- If the PO total changed, resubmission and reevaluation are required.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "APPROVED",
  "approved_at": "2026-08-06T11:00:00+10:00",
  "decision": {
    "approval_source": "USER",
    "decision": "APPROVED",
    "approver_id": 1003,
    "comments": "Approved within delegated authority",
    "po_total_at_decision": 1650.0,
    "decided_at": "2026-08-06T11:00:00+10:00"
  }
}
```

---

# 17. Reject Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/reject
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "reason": "Supplier quotation does not match approved commercial terms"
}
```

## Validation

- PO must be `PENDING_APPROVAL`.
- `reason` is mandatory.
- Assignment and self-approval rules must be enforced.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "REJECTED",
  "decision": {
    "decision": "REJECTED",
    "approver_id": 1003,
    "comments": "Supplier quotation does not match approved commercial terms",
    "decided_at": "2026-08-06T11:00:00+10:00"
  }
}
```

Rejected POs do not proceed to the supplier.

---

# 18. Return Purchase Order for Amendment

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/return
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "reason": "Please update the delivery date and attach the latest quotation"
}
```

## Validation

- PO must be `PENDING_APPROVAL`.
- `reason` is mandatory.
- Approval assignment must be valid.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "RETURNED_FOR_AMENDMENT",
  "decision": {
    "decision": "RETURNED_FOR_AMENDMENT",
    "approver_id": 1003,
    "comments": "Please update the delivery date and attach the latest quotation",
    "decided_at": "2026-08-06T11:00:00+10:00"
  }
}
```

The Procurement Officer may edit and resubmit the PO.

---

# 19. Generate Purchase Order Document

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/document
```

## Access

Procurement Officer or System Administrator

## Purpose

Generates a printable Purchase Order document.

## Validation

- PO must be `APPROVED`, `SENT_TO_SUPPLIER`, or another authorised viewable status.
- Document must display the current approved revision.
- Draft and unapproved POs must be visibly marked if administrative preview is permitted.

## Success Response

```http
201 Created
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "revision_number": 0,
  "document_status": "GENERATED",
  "file_name": "PO-2026-0001-R0.pdf",
  "generated_at": "2026-08-06T11:10:00+10:00"
}
```

Actual document storage design will be defined during backend implementation.

---

# 20. Send Purchase Order to Supplier

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/send
```

## Access

Procurement Officer or System Administrator

## Request Body

```json
{
  "supplier_contact_id": 3101,
  "delivery_channel": "EMAIL",
  "message": "Please find attached our approved Purchase Order."
}
```

## Validation

- PO must be `APPROVED`.
- Contact must belong to the selected supplier and be active.
- An approved PO document must exist or be generated.
- Send attempts must be logged.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "SENT_TO_SUPPLIER",
  "recipient": {
    "supplier_contact_id": 3101,
    "contact_name": "Alex Morgan",
    "email": "alex@southernflour.com.au"
  },
  "sent_at": "2026-08-06T11:15:00+10:00"
}
```

A failed delivery must not falsely mark the PO as successfully sent.

---

# 21. Create Controlled Amendment

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/amendments
```

## Access

Authorised Procurement Officer, Procurement Manager or System Administrator

## Request Body

```json
{
  "reason": "Supplier confirmed a revised delivery date and price",
  "changes": {
    "required_delivery_date": "2026-08-25",
    "items": [
      {
        "purchase_order_item_id": 9101,
        "quantity": 12.0,
        "unit_price": 41.75
      }
    ]
  }
}
```

## Validation

- Original PO must be `APPROVED` or `SENT_TO_SUPPLIER`.
- Amendment reason is mandatory.
- Original approved values must remain recoverable.
- Revision number must increase.
- Material changes must require reapproval.
- Supplier communication may be required for sent orders.
- Changes must be fully audited.

## Success Response

```http
201 Created
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "previous_revision_number": 0,
  "revision_number": 1,
  "status": "DRAFT",
  "reapproval_required": true
}
```

## Design Note

The current Phase 1 schema stores a revision number and detailed audit records.

A dedicated PO revision snapshot table may be added before full amendment implementation if complete immutable document snapshots are required.

---

# 22. Place Purchase Order on Hold

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/hold
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "reason": "Supplier compliance review is in progress"
}
```

## Validation

- `reason` is mandatory.
- PO must be in a hold-eligible status.
- Current status must be preserved so the PO can be released appropriately.
- Hold action must be audited.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "ON_HOLD"
}
```

---

# 23. Release Purchase Order from Hold

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/release
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "comments": "Supplier compliance review completed"
}
```

## Validation

- PO must currently be `ON_HOLD`.
- PO must return to its previous valid active status.
- Release action must be audited.

## Success Response

```http
200 OK
```

---

# 24. Cancel Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/cancel
```

## Access

Authorised Procurement user or System Administrator

## Request Body

```json
{
  "reason": "Business requirement cancelled"
}
```

## Validation

- `reason` is mandatory.
- PO must be in a cancellable status.
- POs with completed receipts or invoices cannot be cancelled through the standard flow.
- Requisition conversion quantities must be restored where appropriate.
- Supplier notification may be required if the PO was already sent.
- Cancellation must preserve history.

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "status": "CANCELLED",
  "cancelled_at": "2026-08-07T09:00:00+10:00"
}
```

---

# 25. Close Purchase Order

## Endpoint

```http
POST /api/v1/purchase-orders/{purchase_order_id}/close
```

## Access

Procurement Manager or System Administrator

## Purpose

Closes a completed or administratively finalised Purchase Order.

## Request Body

```json
{
  "reason": "Purchase Order lifecycle completed"
}
```

## Validation

- PO must meet closure conditions.
- During Phase 1, manual closure may be restricted to authorised users.
- Future receipt and invoice stages will provide automatic closure rules.
- Closure must be audited.

---

# 26. View Purchase Order Approval History

## Endpoint

```http
GET /api/v1/purchase-orders/{purchase_order_id}/approvals
```

## Access

Authorised procurement users

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "items": [
    {
      "purchase_order_approval_id": 10201,
      "approval_level": 1,
      "approval_source": "USER",
      "approver": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "decision": "APPROVED",
      "po_total_at_decision": 1650.0,
      "comments": "Approved within delegated authority",
      "assigned_at": "2026-08-06T10:00:00+10:00",
      "decided_at": "2026-08-06T11:00:00+10:00"
    }
  ]
}
```

---

# 27. View Purchase Order Status History

## Endpoint

```http
GET /api/v1/purchase-orders/{purchase_order_id}/status-history
```

## Access

Authorised procurement users

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "items": [
    {
      "revision_number": 0,
      "previous_status": "DRAFT",
      "new_status": "PENDING_APPROVAL",
      "action": "SUBMIT",
      "comments": "Submitted following supplier quotation review",
      "changed_by": {
        "user_id": 1001,
        "first_name": "Alex",
        "last_name": "Morgan"
      },
      "changed_at": "2026-08-06T10:00:00+10:00"
    },
    {
      "revision_number": 0,
      "previous_status": "PENDING_APPROVAL",
      "new_status": "APPROVED",
      "action": "APPROVE",
      "comments": "Approved within delegated authority",
      "changed_by": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "changed_at": "2026-08-06T11:00:00+10:00"
    }
  ]
}
```

---

# 28. View Purchase Order Revision History

## Endpoint

```http
GET /api/v1/purchase-orders/{purchase_order_id}/revisions
```

## Access

Authorised procurement users

## Success Response

```http
200 OK
```

```json
{
  "purchase_order_id": 9001,
  "po_number": "PO-2026-0001",
  "current_revision_number": 1,
  "items": [
    {
      "revision_number": 0,
      "reason": "Original approved Purchase Order",
      "status": "APPROVED",
      "created_at": "2026-08-06T11:00:00+10:00"
    },
    {
      "revision_number": 1,
      "reason": "Supplier confirmed revised delivery date and price",
      "status": "PENDING_APPROVAL",
      "created_at": "2026-08-07T09:00:00+10:00"
    }
  ]
}
```

The detailed storage strategy for revision snapshots must be finalised during backend implementation.

---

# 29. Purchase Order Deletion Policy

The API shall not provide a standard permanent-delete endpoint for submitted, approved or sent Purchase Orders.

Draft Purchase Orders without dependent workflow history may only be deleted under a controlled administrative policy.

In normal operation, Purchase Orders must be cancelled rather than deleted.

---

# 30. Audit Events

The following events must be recorded:

```text
PURCHASE_ORDER_CREATE
DIRECT_PURCHASE_ORDER_CREATE
PURCHASE_ORDER_UPDATE
PURCHASE_ORDER_ITEM_ADD
PURCHASE_ORDER_ITEM_UPDATE
PURCHASE_ORDER_ITEM_REMOVE
PURCHASE_ORDER_PRICE_OVERRIDE
PURCHASE_ORDER_SUBMIT
PURCHASE_ORDER_AUTO_APPROVE
PURCHASE_ORDER_APPROVE
PURCHASE_ORDER_REJECT
PURCHASE_ORDER_RETURN_FOR_AMENDMENT
PURCHASE_ORDER_RESUBMIT
PURCHASE_ORDER_DOCUMENT_GENERATE
PURCHASE_ORDER_SEND
PURCHASE_ORDER_AMEND
PURCHASE_ORDER_HOLD
PURCHASE_ORDER_RELEASE
PURCHASE_ORDER_CANCEL
PURCHASE_ORDER_CLOSE
PURCHASE_ORDER_STATUS_CHANGE
```

---

# 31. Standard Error Codes

| Code | Meaning |
|---|---|
| `PURCHASE_ORDER_NOT_FOUND` | PO does not exist or is not visible |
| `PURCHASE_ORDER_NOT_EDITABLE` | Current status does not allow editing |
| `PURCHASE_ORDER_INVALID_STATUS` | Requested transition is not permitted |
| `PURCHASE_ORDER_EMPTY` | No valid PO lines exist |
| `PURCHASE_ORDER_ITEM_NOT_FOUND` | PO line does not exist |
| `PURCHASE_ORDER_SUPPLIER_INACTIVE` | Selected supplier is not active |
| `PURCHASE_ORDER_ITEM_INACTIVE` | Selected item is not active |
| `PURCHASE_ORDER_INVALID_SUPPLIER_ITEM` | Supplier-item relationship is invalid |
| `PURCHASE_ORDER_MINIMUM_ORDER_NOT_MET` | Minimum supplier quantity was not met |
| `PURCHASE_ORDER_PRICE_OVERRIDE_REASON_REQUIRED` | Price override lacks a reason |
| `PURCHASE_ORDER_ALREADY_DECIDED` | Approval decision was already completed |
| `PURCHASE_ORDER_SELF_APPROVAL` | User attempted to approve their own PO |
| `PURCHASE_ORDER_APPROVAL_RULE_NOT_FOUND` | No valid approval rule exists |
| `PURCHASE_ORDER_NOT_APPROVED` | Operation requires an approved PO |
| `PURCHASE_ORDER_NOT_CANCELLABLE` | PO cannot be cancelled in its current state |
| `PURCHASE_ORDER_REQUISITION_QUANTITY_EXCEEDED` | PO exceeds remaining approved requisition quantity |

---

# 32. Standard Error Format

```json
{
  "error": {
    "code": "PURCHASE_ORDER_NOT_EDITABLE",
    "message": "Only Draft or Returned for Amendment Purchase Orders can be edited.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
