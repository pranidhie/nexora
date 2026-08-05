# Purchase Requisition API Specification

## 1. Purpose

This document defines the REST API contract for Purchase Requisition Management in NEXORA.

The Purchase Requisition API supports:

- Creating purchase requisitions
- Adding and updating requisition items
- Saving requisitions as drafts
- Submitting requisitions for approval
- Approving, rejecting and returning requisitions
- Cancelling requisitions
- Viewing requisition history
- Searching and filtering requisitions
- Converting approved requisitions into Purchase Orders

All endpoints use JSON unless otherwise stated.

---

# 2. Base Path

```text
/api/v1/purchase-requisitions
```

---

# 3. Authorization

| Operation | Allowed Roles |
|---|---|
| Create requisition | `REQUESTER`, `SYSTEM_ADMINISTRATOR` |
| View own requisitions | `REQUESTER` |
| View all requisitions | `PROCUREMENT_OFFICER`, `PROCUREMENT_MANAGER`, `NOMINATED_APPROVER`, `SYSTEM_ADMINISTRATOR` |
| Edit draft or returned requisition | Original requester or `SYSTEM_ADMINISTRATOR` |
| Submit requisition | Original requester or `SYSTEM_ADMINISTRATOR` |
| Approve, reject or return | Assigned `NOMINATED_APPROVER` or `SYSTEM_ADMINISTRATOR` |
| Cancel requisition | Original requester, authorised procurement user or `SYSTEM_ADMINISTRATOR` |
| Convert to PO | `PROCUREMENT_OFFICER`, `SYSTEM_ADMINISTRATOR` |

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

---

# 4. Requisition Statuses

```text
DRAFT
SUBMITTED
PENDING_APPROVAL
RETURNED_FOR_AMENDMENT
APPROVED
REJECTED
CANCELLED
PARTIALLY_CONVERTED
CONVERTED_TO_PO
CLOSED
```

The API must reject invalid status transitions.

---

# 5. Create Purchase Requisition

## Endpoint

```http
POST /api/v1/purchase-requisitions
```

## Access

Requester or System Administrator

## Purpose

Creates a new Purchase Requisition in `DRAFT` status.

## Request Body

```json
{
  "department": "Production",
  "required_date": "2026-08-20",
  "justification": "Raw materials required for the August production schedule",
  "currency_code": "AUD",
  "items": [
    {
      "catalogue_item_id": 6001,
      "description": "Premium Wheat Flour",
      "quantity": 100.0,
      "requested_uom_id": 5001,
      "estimated_unit_price": 2.5,
      "required_date": "2026-08-20",
      "non_catalogue_item": false
    }
  ]
}
```

## Validation

- `department` is mandatory.
- `required_date` is mandatory.
- `justification` is mandatory.
- At least one item is required.
- Each quantity must be greater than zero.
- Each estimated unit price must be zero or greater.
- `catalogue_item_id` is mandatory unless `non_catalogue_item = true`.
- Catalogue items must be active.
- Units of measure must be active.
- The system must calculate line totals and requisition total.
- The system must generate a unique requisition number.
- Initial status must be `DRAFT`.

## Success Response

```http
201 Created
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "requested_by": 1005,
  "department": "Production",
  "required_date": "2026-08-20",
  "justification": "Raw materials required for the August production schedule",
  "estimated_total": 250.0,
  "currency_code": "AUD",
  "status": "DRAFT",
  "items": [
    {
      "purchase_requisition_item_id": 8101,
      "line_number": 1,
      "catalogue_item_id": 6001,
      "description": "Premium Wheat Flour",
      "quantity": 100.0,
      "requested_uom_id": 5001,
      "estimated_unit_price": 2.5,
      "estimated_line_total": 250.0,
      "required_date": "2026-08-20",
      "non_catalogue_item": false,
      "converted_quantity": 0.0
    }
  ],
  "created_at": "2026-08-05T18:00:00+10:00",
  "created_by": 1005
}
```

---

# 6. List and Search Purchase Requisitions

## Endpoint

```http
GET /api/v1/purchase-requisitions
```

## Access

Authorised users

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `search` | string | No | Searches requisition number, department and justification |
| `status` | string | No | Filters by requisition status |
| `requested_by` | integer | No | Filters by requester |
| `department` | string | No | Filters by department |
| `required_date_from` | date | No | Minimum required date |
| `required_date_to` | date | No | Maximum required date |
| `created_date_from` | date | No | Minimum creation date |
| `created_date_to` | date | No | Maximum creation date |
| `minimum_amount` | decimal | No | Minimum estimated total |
| `maximum_amount` | decimal | No | Maximum estimated total |
| `page` | integer | No | Page number, default `1` |
| `page_size` | integer | No | Page size, default `20`, maximum `100` |
| `sort_by` | string | No | Supported sorting field |
| `sort_order` | string | No | `asc` or `desc` |

## Access Behaviour

- Requesters should see only their own requisitions unless they have another authorised role.
- Procurement and approval roles may see requisitions within their permitted scope.

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "purchase_requisition_id": 8001,
      "requisition_number": "PR-2026-0001",
      "requested_by": {
        "user_id": 1005,
        "first_name": "Jordan",
        "last_name": "Lee"
      },
      "department": "Production",
      "required_date": "2026-08-20",
      "estimated_total": 250.0,
      "currency_code": "AUD",
      "status": "PENDING_APPROVAL",
      "created_at": "2026-08-05T18:00:00+10:00"
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

# 7. Get Purchase Requisition Details

## Endpoint

```http
GET /api/v1/purchase-requisitions/{purchase_requisition_id}
```

## Access

Authorised users

## Purpose

Returns the requisition, lines, approvals, conversion details and status history.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "requested_by": {
    "user_id": 1005,
    "first_name": "Jordan",
    "last_name": "Lee",
    "email": "jordan.lee@nexora.com"
  },
  "department": "Production",
  "required_date": "2026-08-20",
  "justification": "Raw materials required for the August production schedule",
  "estimated_total": 250.0,
  "currency_code": "AUD",
  "status": "PENDING_APPROVAL",
  "submitted_at": "2026-08-05T18:30:00+10:00",
  "approved_at": null,
  "items": [
    {
      "purchase_requisition_item_id": 8101,
      "line_number": 1,
      "catalogue_item": {
        "catalogue_item_id": 6001,
        "item_code": "RM-FLOUR-001",
        "item_name": "Premium Wheat Flour"
      },
      "description": "Premium Wheat Flour",
      "quantity": 100.0,
      "requested_uom": {
        "uom_id": 5001,
        "uom_code": "KG",
        "uom_name": "Kilogram"
      },
      "estimated_unit_price": 2.5,
      "estimated_line_total": 250.0,
      "required_date": "2026-08-20",
      "non_catalogue_item": false,
      "converted_quantity": 0.0,
      "remaining_quantity": 100.0
    }
  ],
  "approvals": [
    {
      "approval_level": 1,
      "approver_id": 1003,
      "decision": "PENDING",
      "assigned_at": "2026-08-05T18:30:00+10:00"
    }
  ],
  "status_history": [
    {
      "previous_status": null,
      "new_status": "DRAFT",
      "action": "CREATE",
      "changed_by": 1005,
      "changed_at": "2026-08-05T18:00:00+10:00"
    },
    {
      "previous_status": "DRAFT",
      "new_status": "PENDING_APPROVAL",
      "action": "SUBMIT",
      "changed_by": 1005,
      "changed_at": "2026-08-05T18:30:00+10:00"
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
    "code": "REQUISITION_NOT_FOUND",
    "message": "The requested Purchase Requisition could not be found."
  }
}
```

---

# 8. Update Purchase Requisition Header

## Endpoint

```http
PATCH /api/v1/purchase-requisitions/{purchase_requisition_id}
```

## Access

Original requester or System Administrator

## Purpose

Updates the requisition header while it is editable.

## Request Body

```json
{
  "department": "Production Planning",
  "required_date": "2026-08-22",
  "justification": "Updated production schedule"
}
```

## Validation

- Only `DRAFT` and `RETURNED_FOR_AMENDMENT` requisitions may be edited.
- The user must be the requester or have elevated permission.
- Mandatory values must remain valid.
- Changes must be audited.
- The requisition total must be recalculated when relevant.

## Success Response

```http
200 OK
```

Returns the updated requisition.

## Invalid Status Response

```http
409 Conflict
```

```json
{
  "error": {
    "code": "REQUISITION_NOT_EDITABLE",
    "message": "Only Draft or Returned for Amendment requisitions can be edited."
  }
}
```

---

# 9. Add Requisition Item

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/items
```

## Access

Original requester or System Administrator

## Request Body

```json
{
  "catalogue_item_id": 6002,
  "description": "Food-grade packaging film",
  "quantity": 20.0,
  "requested_uom_id": 5003,
  "estimated_unit_price": 18.0,
  "required_date": "2026-08-20",
  "non_catalogue_item": false
}
```

## Validation

- Requisition must be `DRAFT` or `RETURNED_FOR_AMENDMENT`.
- Quantity must be greater than zero.
- Unit price must be zero or greater.
- Catalogue item and UOM must be active.
- The next line number must be generated.
- Requisition total must be recalculated.
- The operation must be audited.

## Success Response

```http
201 Created
```

Returns the new requisition item and updated requisition total.

---

# 10. Update Requisition Item

## Endpoint

```http
PATCH /api/v1/purchase-requisitions/{purchase_requisition_id}/items/{requisition_item_id}
```

## Access

Original requester or System Administrator

## Request Body

```json
{
  "quantity": 120.0,
  "estimated_unit_price": 2.45,
  "required_date": "2026-08-22"
}
```

## Validation

- Requisition must be editable.
- The item must belong to the requisition.
- Quantity and price rules must be satisfied.
- Converted quantities cannot be reduced below the quantity already converted.
- Line and requisition totals must be recalculated.
- Changes must be audited.

## Success Response

```http
200 OK
```

---

# 11. Remove Requisition Item

## Endpoint

```http
DELETE /api/v1/purchase-requisitions/{purchase_requisition_id}/items/{requisition_item_id}
```

## Access

Original requester or System Administrator

## Validation

- Requisition must be `DRAFT` or `RETURNED_FOR_AMENDMENT`.
- Item must belong to the requisition.
- An item with a converted quantity greater than zero cannot be removed.
- At least one line must remain before submission.
- Requisition total must be recalculated.
- The removal must be audited.

## Success Response

```http
204 No Content
```

---

# 12. Submit Purchase Requisition

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/submit
```

## Access

Original requester or System Administrator

## Request Body

```json
{
  "comments": "Required for the approved production plan"
}
```

## Validation

- Requisition must be `DRAFT` or `RETURNED_FOR_AMENDMENT`.
- At least one valid line is required.
- All mandatory information must be complete.
- Requested items and UOMs must remain active.
- Quantities must be greater than zero.
- Requisition total must be recalculated before submission.
- Approval rules must be evaluated.
- Self-approval must be prevented where applicable.

## Workflow Behaviour

If an applicable auto-approval rule exists:

```text
DRAFT or RETURNED_FOR_AMENDMENT
→ APPROVED
```

If human approval is required:

```text
DRAFT or RETURNED_FOR_AMENDMENT
→ PENDING_APPROVAL
```

The system must:

- set `submitted_at`
- create the approval record
- create the status-history record
- create approver notifications
- write an audit event
- commit all changes in one transaction

## Success Response — Pending Approval

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "PENDING_APPROVAL",
  "submitted_at": "2026-08-05T18:30:00+10:00",
  "approval": {
    "approval_level": 1,
    "decision": "PENDING",
    "approver_id": 1003
  }
}
```

## Success Response — Auto Approved

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "APPROVED",
  "submitted_at": "2026-08-05T18:30:00+10:00",
  "approved_at": "2026-08-05T18:30:00+10:00",
  "approval": {
    "approval_level": 1,
    "decision": "APPROVED",
    "approval_source": "SYSTEM"
  }
}
```

---

# 13. Approve Purchase Requisition

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/approve
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "comments": "Approved for August production"
}
```

## Validation

- Requisition must be `PENDING_APPROVAL`.
- A pending approval must be assigned to the current user or an authorised role.
- The approver must not be the requisition creator.
- The approval record must still be pending.
- Duplicate approval actions must be prevented.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "APPROVED",
  "approved_at": "2026-08-06T09:30:00+10:00",
  "decision": {
    "decision": "APPROVED",
    "approver_id": 1003,
    "comments": "Approved for August production",
    "decided_at": "2026-08-06T09:30:00+10:00"
  }
}
```

## Transaction Behaviour

The API must update:

- requisition status
- approval decision
- `approved_at`
- status history
- requester notification
- audit log

within one transaction.

---

# 14. Reject Purchase Requisition

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/reject
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "reason": "The requested quantity exceeds the approved production requirement"
}
```

## Validation

- Requisition must be `PENDING_APPROVAL`.
- `reason` is mandatory.
- Approver assignment and self-approval rules must be enforced.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "REJECTED",
  "decision": {
    "decision": "REJECTED",
    "approver_id": 1003,
    "comments": "The requested quantity exceeds the approved production requirement",
    "decided_at": "2026-08-06T09:30:00+10:00"
  }
}
```

---

# 15. Return Requisition for Amendment

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/return
```

## Access

Assigned Nominated Approver or System Administrator

## Request Body

```json
{
  "reason": "Please confirm the required date and reduce the packaging quantity"
}
```

## Validation

- Requisition must be `PENDING_APPROVAL`.
- `reason` is mandatory.
- Approver assignment must be valid.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "RETURNED_FOR_AMENDMENT",
  "decision": {
    "decision": "RETURNED_FOR_AMENDMENT",
    "approver_id": 1003,
    "comments": "Please confirm the required date and reduce the packaging quantity",
    "decided_at": "2026-08-06T09:30:00+10:00"
  }
}
```

The requester must be notified and allowed to edit and resubmit.

---

# 16. Cancel Purchase Requisition

## Endpoint

```http
POST /api/v1/purchase-requisitions/{purchase_requisition_id}/cancel
```

## Access

Original requester, authorised procurement user or System Administrator

## Request Body

```json
{
  "reason": "Production requirement has been cancelled"
}
```

## Validation

- `reason` is mandatory.
- Requisition must be in a cancellable status.
- Requisitions already fully converted to Purchase Orders cannot be cancelled.
- Partially converted requisitions require special validation.
- Cancellation must preserve historical records.

## Typical Cancellable Statuses

```text
DRAFT
SUBMITTED
PENDING_APPROVAL
RETURNED_FOR_AMENDMENT
APPROVED
```

Business rules may restrict cancellation of approved or partially converted requisitions.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "CANCELLED",
  "cancelled_at": "2026-08-06T10:00:00+10:00"
}
```

---

# 17. View Requisition Approval History

## Endpoint

```http
GET /api/v1/purchase-requisitions/{purchase_requisition_id}/approvals
```

## Access

Authorised users

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "items": [
    {
      "purchase_requisition_approval_id": 10101,
      "approval_level": 1,
      "approver": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "decision": "APPROVED",
      "comments": "Approved for August production",
      "assigned_at": "2026-08-05T18:30:00+10:00",
      "decided_at": "2026-08-06T09:30:00+10:00"
    }
  ]
}
```

---

# 18. View Requisition Status History

## Endpoint

```http
GET /api/v1/purchase-requisitions/{purchase_requisition_id}/status-history
```

## Access

Authorised users

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "items": [
    {
      "previous_status": "DRAFT",
      "new_status": "PENDING_APPROVAL",
      "action": "SUBMIT",
      "comments": "Required for the approved production plan",
      "changed_by": {
        "user_id": 1005,
        "first_name": "Jordan",
        "last_name": "Lee"
      },
      "changed_at": "2026-08-05T18:30:00+10:00"
    },
    {
      "previous_status": "PENDING_APPROVAL",
      "new_status": "APPROVED",
      "action": "APPROVE",
      "comments": "Approved for August production",
      "changed_by": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "changed_at": "2026-08-06T09:30:00+10:00"
    }
  ]
}
```

---

# 19. Get Requisition Conversion Availability

## Endpoint

```http
GET /api/v1/purchase-requisitions/{purchase_requisition_id}/conversion-availability
```

## Access

Procurement Officer or System Administrator

## Purpose

Returns quantities available for conversion into one or more Standard Purchase Orders.

## Success Response

```http
200 OK
```

```json
{
  "purchase_requisition_id": 8001,
  "requisition_number": "PR-2026-0001",
  "status": "APPROVED",
  "convertible": true,
  "items": [
    {
      "purchase_requisition_item_id": 8101,
      "catalogue_item_id": 6001,
      "approved_quantity": 100.0,
      "converted_quantity": 40.0,
      "remaining_quantity": 60.0,
      "requested_uom_id": 5001
    }
  ]
}
```

## Validation

- Requisition must be `APPROVED` or `PARTIALLY_CONVERTED`.
- Remaining quantities must be greater than zero.
- Cancelled, rejected and closed requisitions are not convertible.

---

# 20. Conversion Behaviour

The actual Purchase Order creation endpoint will be defined in `purchase-order-api.md`.

When a Standard PO is created from a requisition, the system must:

- validate the requisition status
- validate selected requisition lines
- prevent over-conversion
- update `converted_quantity`
- set requisition status to:
  - `PARTIALLY_CONVERTED`, or
  - `CONVERTED_TO_PO`
- create status-history records
- write audit events
- commit all changes in one transaction

---

# 21. Requisition Deletion Policy

The API shall not provide a standard permanent-delete endpoint for submitted requisitions.

A draft requisition with no audit or dependent records may be deleted only under a controlled administrative policy.

In normal use, requisitions must be cancelled rather than deleted.

---

# 22. Audit Events

The following events must be recorded:

```text
REQUISITION_CREATE
REQUISITION_UPDATE
REQUISITION_ITEM_ADD
REQUISITION_ITEM_UPDATE
REQUISITION_ITEM_REMOVE
REQUISITION_SUBMIT
REQUISITION_AUTO_APPROVE
REQUISITION_APPROVE
REQUISITION_REJECT
REQUISITION_RETURN_FOR_AMENDMENT
REQUISITION_RESUBMIT
REQUISITION_CANCEL
REQUISITION_PARTIALLY_CONVERT
REQUISITION_CONVERT_TO_PO
REQUISITION_STATUS_CHANGE
```

---

# 23. Standard Error Codes

| Code | Meaning |
|---|---|
| `REQUISITION_NOT_FOUND` | Requisition does not exist or is not visible to the user |
| `REQUISITION_NOT_EDITABLE` | Current status does not allow editing |
| `REQUISITION_INVALID_STATUS` | Requested transition is not permitted |
| `REQUISITION_EMPTY` | No valid items exist |
| `REQUISITION_ITEM_NOT_FOUND` | Requisition line does not exist |
| `REQUISITION_ALREADY_DECIDED` | Approval has already been completed |
| `REQUISITION_SELF_APPROVAL` | User attempted to approve their own requisition |
| `REQUISITION_NOT_CONVERTIBLE` | Requisition cannot be converted to a PO |
| `REQUISITION_QUANTITY_EXCEEDED` | Requested conversion exceeds remaining quantity |
| `APPROVAL_RULE_NOT_FOUND` | No valid approval rule could be applied |

---

# 24. Standard Error Format

```json
{
  "error": {
    "code": "REQUISITION_NOT_EDITABLE",
    "message": "Only Draft or Returned for Amendment requisitions can be edited.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
