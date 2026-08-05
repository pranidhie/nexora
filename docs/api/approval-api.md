# Approval API Specification

## 1. Purpose

This document defines the REST API contract for approval configuration and approval-task management in NEXORA.

The Approval API supports:

- Maintaining approval thresholds
- Assigning nominated approvers
- Retrieving pending approval tasks
- Viewing approval decisions
- Supporting Purchase Requisition approvals
- Supporting Purchase Order approvals
- Enforcing separation of duties
- Preserving approval history

Document-specific approval actions remain available through the Purchase Requisition and Purchase Order APIs.

---

# 2. Base Paths

```text
/api/v1/approval-rules
/api/v1/approval-tasks
```

---

# 3. Authorization

| Operation | Allowed Roles |
|---|---|
| View approval rules | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Create or update approval rules | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Activate or deactivate approval rules | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| View assigned approval tasks | `NOMINATED_APPROVER`, `SYSTEM_ADMINISTRATOR` |
| View all approval tasks | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| View approval history | Authorised procurement users |
| Perform approval decision | Assigned approver or `SYSTEM_ADMINISTRATOR` |

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

---

# 4. Supported Document Types

```text
PURCHASE_REQUISITION
PURCHASE_ORDER
```

Future document types may be added when additional NEXORA modules are introduced.

---

# 5. Approval Decision Values

```text
PENDING
APPROVED
REJECTED
RETURNED_FOR_AMENDMENT
CANCELLED
```

---

# 6. Create Approval Rule

## Endpoint

```http
POST /api/v1/approval-rules
```

## Access

Procurement Manager or System Administrator

## Purpose

Creates a configurable approval rule for a procurement document.

## Request Body — Auto-Approval Rule

```json
{
  "document_type": "PURCHASE_ORDER",
  "minimum_amount": 0.0,
  "maximum_amount": 999.99,
  "currency_code": "AUD",
  "approval_level": 1,
  "auto_approve": true,
  "effective_from": "2026-08-01",
  "effective_to": null
}
```

## Request Body — Manual Approval Rule

```json
{
  "document_type": "PURCHASE_ORDER",
  "minimum_amount": 1000.0,
  "maximum_amount": null,
  "currency_code": "AUD",
  "approval_level": 1,
  "approver_role_id": 3,
  "auto_approve": false,
  "effective_from": "2026-08-01",
  "effective_to": null
}
```

A specific approver may be configured using:

```json
{
  "approver_user_id": 1003
}
```

## Validation

- `document_type` must be supported.
- `minimum_amount` must be zero or greater.
- `maximum_amount`, when provided, must be greater than or equal to `minimum_amount`.
- `approval_level` must be greater than zero.
- `effective_to` must not be before `effective_from`.
- Auto-approval rules must not contain an approver user or role.
- Manual rules must identify an approver user, approver role, or both.
- Conflicting active amount ranges must be prevented.
- Currency must use a supported code.
- The selected user or role must be active.

## Success Response

```http
201 Created
```

```json
{
  "approval_rule_id": 10001,
  "document_type": "PURCHASE_ORDER",
  "minimum_amount": 1000.0,
  "maximum_amount": null,
  "currency_code": "AUD",
  "approval_level": 1,
  "approver_user": null,
  "approver_role": {
    "role_id": 3,
    "role_code": "NOMINATED_APPROVER",
    "role_name": "Nominated Approver"
  },
  "auto_approve": false,
  "active": true,
  "effective_from": "2026-08-01",
  "effective_to": null,
  "created_at": "2026-08-05T17:00:00+10:00",
  "created_by": 1004
}
```

## Conflict Response

```http
409 Conflict
```

```json
{
  "error": {
    "code": "APPROVAL_RULE_OVERLAP",
    "message": "The approval rule overlaps an existing active rule."
  }
}
```

---

# 7. List Approval Rules

## Endpoint

```http
GET /api/v1/approval-rules
```

## Access

Procurement Manager or System Administrator

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `document_type` | string | No | Filters by supported document type |
| `currency_code` | string | No | Filters by currency |
| `approval_level` | integer | No | Filters by approval level |
| `auto_approve` | boolean | No | Filters automatic or manual rules |
| `active` | boolean | No | Filters active state |
| `effective_on` | date | No | Returns rules effective on a date |
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
      "approval_rule_id": 10001,
      "document_type": "PURCHASE_ORDER",
      "minimum_amount": 0.0,
      "maximum_amount": 999.99,
      "currency_code": "AUD",
      "approval_level": 1,
      "auto_approve": true,
      "active": true,
      "effective_from": "2026-08-01",
      "effective_to": null
    },
    {
      "approval_rule_id": 10002,
      "document_type": "PURCHASE_ORDER",
      "minimum_amount": 1000.0,
      "maximum_amount": null,
      "currency_code": "AUD",
      "approval_level": 1,
      "approver_role": {
        "role_code": "NOMINATED_APPROVER",
        "role_name": "Nominated Approver"
      },
      "auto_approve": false,
      "active": true,
      "effective_from": "2026-08-01",
      "effective_to": null
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 2,
    "total_pages": 1
  }
}
```

---

# 8. Get Approval Rule

## Endpoint

```http
GET /api/v1/approval-rules/{approval_rule_id}
```

## Access

Procurement Manager or System Administrator

## Success Response

```http
200 OK
```

Returns the complete approval-rule record.

## Not Found Response

```http
404 Not Found
```

```json
{
  "error": {
    "code": "APPROVAL_RULE_NOT_FOUND",
    "message": "The requested approval rule could not be found."
  }
}
```

---

# 9. Update Approval Rule

## Endpoint

```http
PATCH /api/v1/approval-rules/{approval_rule_id}
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "maximum_amount": 4999.99,
  "approver_user_id": 1003,
  "approver_role_id": null,
  "effective_to": "2026-12-31"
}
```

## Validation

- Only supplied fields are updated.
- Updated ranges must not conflict with other active rules.
- Historical approval records must continue referencing the rule used at decision time.
- Changes must not retroactively alter completed approvals.
- Rule changes must be audited.
- For material rule changes, creating a new effective-dated rule is preferred over overwriting historical configuration.

## Success Response

```http
200 OK
```

Returns the updated approval rule.

---

# 10. Change Approval Rule Status

## Endpoint

```http
PATCH /api/v1/approval-rules/{approval_rule_id}/status
```

## Access

Procurement Manager or System Administrator

## Request Body

```json
{
  "active": false,
  "reason": "Replaced by a revised approval matrix"
}
```

## Validation

- `reason` is mandatory when deactivating.
- Deactivation must not remove historical references.
- A rule assigned to a pending approval task must not be deactivated without controlled reassignment or cancellation.
- The action must be audited.

## Success Response

```http
200 OK
```

---

# 11. Evaluate Approval Rule

## Endpoint

```http
POST /api/v1/approval-rules/evaluate
```

## Access

Internal service, Procurement Manager or System Administrator

## Purpose

Returns the approval rule that applies to a proposed document value.

This endpoint may be used for UI preview and workflow testing. The backend must reevaluate the rule during document submission.

## Request Body

```json
{
  "document_type": "PURCHASE_ORDER",
  "amount": 1650.0,
  "currency_code": "AUD",
  "effective_date": "2026-08-06"
}
```

## Success Response — Manual Approval

```http
200 OK
```

```json
{
  "matched": true,
  "approval_rule_id": 10002,
  "document_type": "PURCHASE_ORDER",
  "amount": 1650.0,
  "currency_code": "AUD",
  "approval_level": 1,
  "auto_approve": false,
  "approver_role": {
    "role_id": 3,
    "role_code": "NOMINATED_APPROVER"
  }
}
```

## Success Response — Auto Approval

```http
200 OK
```

```json
{
  "matched": true,
  "approval_rule_id": 10001,
  "document_type": "PURCHASE_ORDER",
  "amount": 850.0,
  "currency_code": "AUD",
  "approval_level": 1,
  "auto_approve": true,
  "approver_user": null,
  "approver_role": null
}
```

## No Matching Rule

```http
422 Unprocessable Entity
```

```json
{
  "error": {
    "code": "APPROVAL_RULE_NOT_FOUND",
    "message": "No active approval rule applies to this document."
  }
}
```

---

# 12. List Approval Tasks

## Endpoint

```http
GET /api/v1/approval-tasks
```

## Access

Nominated Approver, Procurement Manager or System Administrator

## Purpose

Returns approval tasks visible to the current user.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `document_type` | string | No | Filters requisitions or Purchase Orders |
| `decision` | string | No | Defaults to `PENDING` |
| `assigned_to_me` | boolean | No | Defaults to `true` for approvers |
| `approval_level` | integer | No | Filters approval level |
| `date_from` | date | No | Assignment start date |
| `date_to` | date | No | Assignment end date |
| `minimum_amount` | decimal | No | Minimum document amount |
| `maximum_amount` | decimal | No | Maximum document amount |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Records per page |
| `sort_by` | string | No | Supported sort field |
| `sort_order` | string | No | `asc` or `desc` |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "approval_task_id": "PO-10201",
      "document_type": "PURCHASE_ORDER",
      "document_id": 9001,
      "document_number": "PO-2026-0001",
      "document_status": "PENDING_APPROVAL",
      "approval_level": 1,
      "decision": "PENDING",
      "assigned_at": "2026-08-06T10:00:00+10:00",
      "amount": 1650.0,
      "currency_code": "AUD",
      "submitted_by": {
        "user_id": 1001,
        "first_name": "Alex",
        "last_name": "Morgan"
      },
      "supplier": {
        "supplier_id": 3001,
        "supplier_name": "Southern Flour Mills"
      }
    },
    {
      "approval_task_id": "PR-10101",
      "document_type": "PURCHASE_REQUISITION",
      "document_id": 8001,
      "document_number": "PR-2026-0001",
      "document_status": "PENDING_APPROVAL",
      "approval_level": 1,
      "decision": "PENDING",
      "assigned_at": "2026-08-05T18:30:00+10:00",
      "amount": 2500.0,
      "currency_code": "AUD",
      "submitted_by": {
        "user_id": 1005,
        "first_name": "Jordan",
        "last_name": "Lee"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 2,
    "total_pages": 1
  }
}
```

---

# 13. Get Approval Task Details

## Endpoint

```http
GET /api/v1/approval-tasks/{approval_task_id}
```

## Access

Assigned approver, Procurement Manager or System Administrator

## Approval Task ID Format

```text
PR-{purchase_requisition_approval_id}
PO-{purchase_order_approval_id}
```

Examples:

```text
PR-10101
PO-10201
```

## Success Response

```http
200 OK
```

```json
{
  "approval_task_id": "PO-10201",
  "document_type": "PURCHASE_ORDER",
  "document": {
    "purchase_order_id": 9001,
    "po_number": "PO-2026-0001",
    "order_type": "STANDARD",
    "supplier_name": "Southern Flour Mills",
    "total_amount": 1650.0,
    "currency_code": "AUD",
    "status": "PENDING_APPROVAL",
    "revision_number": 0
  },
  "approval": {
    "approval_level": 1,
    "approval_source": "USER",
    "approver_id": 1003,
    "decision": "PENDING",
    "assigned_at": "2026-08-06T10:00:00+10:00"
  },
  "available_actions": [
    "APPROVE",
    "REJECT",
    "RETURN_FOR_AMENDMENT"
  ]
}
```

---

# 14. Get Current User Approval Summary

## Endpoint

```http
GET /api/v1/approval-tasks/summary
```

## Access

Nominated Approver, Procurement Manager or System Administrator

## Success Response

```http
200 OK
```

```json
{
  "pending_total": 8,
  "pending_purchase_requisitions": 3,
  "pending_purchase_orders": 5,
  "overdue_total": 2,
  "oldest_pending_assigned_at": "2026-08-02T09:00:00+10:00"
}
```

---

# 15. Perform Approval Decisions

Document decisions must use the appropriate document API:

```http
POST /api/v1/purchase-requisitions/{id}/approve
POST /api/v1/purchase-requisitions/{id}/reject
POST /api/v1/purchase-requisitions/{id}/return

POST /api/v1/purchase-orders/{id}/approve
POST /api/v1/purchase-orders/{id}/reject
POST /api/v1/purchase-orders/{id}/return
```

This ensures each document service applies its own:

- status-transition rules
- business validation
- notifications
- audit events
- transaction handling

The general Approval API shall not bypass document-specific workflow services.

---

# 16. View Approval History

## Endpoint

```http
GET /api/v1/approval-tasks/history
```

## Access

Authorised procurement users

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `document_type` | string | No | Filters document type |
| `document_id` | integer | No | Filters document record |
| `document_number` | string | No | Searches business document number |
| `approver_id` | integer | No | Filters approver |
| `decision` | string | No | Filters decision |
| `date_from` | date | No | Decision start date |
| `date_to` | date | No | Decision end date |
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
      "approval_task_id": "PO-10201",
      "document_type": "PURCHASE_ORDER",
      "document_id": 9001,
      "document_number": "PO-2026-0001",
      "approval_level": 1,
      "approver": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "approval_source": "USER",
      "decision": "APPROVED",
      "comments": "Approved within delegated authority",
      "amount_at_decision": 1650.0,
      "assigned_at": "2026-08-06T10:00:00+10:00",
      "decided_at": "2026-08-06T11:00:00+10:00"
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

# 17. Approval Assignment Rules

When a manual approval rule references a specific user:

- that active user must receive the task
- the user must have approval permission
- the user must not be the document creator

When a rule references an approver role:

- an eligible active user with that role must be selected
- assignment strategy may initially use a configured nominated user
- future versions may support workload balancing or department-based routing

If no eligible approver can be resolved, submission must fail safely with:

```text
APPROVER_NOT_AVAILABLE
```

The document must not be left in a misleading approved or pending state without an approval assignment.

---

# 18. Separation of Duties

The system must prevent a user from approving a document they created.

This applies even when the user has both:

- a creator role, and
- the `NOMINATED_APPROVER` role

System Administrator override should be restricted, explicitly recorded and used only under controlled conditions.

Any override must include:

- override reason
- administrator user ID
- original document creator
- date and time
- audit event

---

# 19. Concurrent Decision Protection

The API must prevent two users from deciding the same pending approval task simultaneously.

Recommended controls include:

- database row locking
- optimistic concurrency checks
- verification that the decision is still `PENDING`
- atomic status and approval updates

A second decision attempt must return:

```http
409 Conflict
```

```json
{
  "error": {
    "code": "APPROVAL_ALREADY_DECIDED",
    "message": "This approval task has already been completed."
  }
}
```

---

# 20. Approval Audit Events

The following events must be recorded:

```text
APPROVAL_RULE_CREATE
APPROVAL_RULE_UPDATE
APPROVAL_RULE_ACTIVATE
APPROVAL_RULE_DEACTIVATE
APPROVAL_RULE_EVALUATE
APPROVAL_TASK_ASSIGN
APPROVAL_TASK_REASSIGN
APPROVAL_APPROVE
APPROVAL_REJECT
APPROVAL_RETURN_FOR_AMENDMENT
APPROVAL_CANCEL
APPROVAL_ADMIN_OVERRIDE
```

---

# 21. Standard Error Codes

| Code | Meaning |
|---|---|
| `APPROVAL_RULE_NOT_FOUND` | No rule exists or matches the request |
| `APPROVAL_RULE_OVERLAP` | Rule conflicts with another active range |
| `APPROVAL_RULE_INACTIVE` | Selected rule is inactive |
| `APPROVAL_RULE_INVALID_RANGE` | Amount or effective-date range is invalid |
| `APPROVAL_TASK_NOT_FOUND` | Approval task does not exist or is not visible |
| `APPROVAL_NOT_ASSIGNED` | Current user is not assigned to the task |
| `APPROVAL_ALREADY_DECIDED` | Approval is no longer pending |
| `APPROVAL_SELF_APPROVAL` | User attempted to approve their own document |
| `APPROVER_NOT_AVAILABLE` | No valid approver could be assigned |
| `APPROVAL_DOCUMENT_CHANGED` | Document changed after submission |
| `APPROVAL_INVALID_DOCUMENT_STATUS` | Document is not awaiting approval |
| `APPROVAL_COMMENTS_REQUIRED` | Rejection or return lacks a reason |

---

# 22. Standard Error Format

```json
{
  "error": {
    "code": "APPROVAL_ALREADY_DECIDED",
    "message": "This approval task has already been completed.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
