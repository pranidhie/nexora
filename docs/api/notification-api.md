# Notification API Specification

## 1. Purpose

This document defines the REST API contract for workflow notifications in NEXORA.

The Notification API supports:

- Listing user notifications
- Viewing notification details
- Marking notifications as read
- Marking all notifications as read
- Viewing unread notification counts
- Retrying failed notifications
- Viewing notification delivery history
- Supporting in-application notifications
- Supporting future email notifications

All endpoints use JSON unless otherwise stated.

---

# 2. Base Path

```text
/api/v1/notifications
```

---

# 3. Authorization

| Operation | Allowed Roles |
|---|---|
| View own notifications | Any authenticated user |
| Mark own notifications as read | Any authenticated user |
| View notification delivery history | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |
| Retry failed notification | `SYSTEM_ADMINISTRATOR` |
| View failed notifications | `PROCUREMENT_MANAGER`, `SYSTEM_ADMINISTRATOR` |

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

Users must not be able to view or modify another user's notifications unless they have explicit administrative permission.

---

# 4. Notification Channels

Initial supported channels:

```text
IN_APP
EMAIL
```

Phase 1 will primarily use:

```text
IN_APP
```

Email delivery may be enabled later.

---

# 5. Notification Statuses

```text
PENDING
SENT
FAILED
READ
```

Meaning:

| Status | Description |
|---|---|
| `PENDING` | Notification has been created but not yet delivered |
| `SENT` | Notification has been delivered successfully |
| `FAILED` | Notification delivery failed |
| `READ` | Recipient has opened or marked the notification as read |

---

# 6. Notification Types

Initial notification types may include:

```text
REQUISITION_APPROVAL_REQUIRED
REQUISITION_APPROVED
REQUISITION_REJECTED
REQUISITION_RETURNED

PURCHASE_ORDER_APPROVAL_REQUIRED
PURCHASE_ORDER_APPROVED
PURCHASE_ORDER_REJECTED
PURCHASE_ORDER_RETURNED
PURCHASE_ORDER_SENT

SUPPLIER_STATUS_CHANGED
CATALOGUE_ITEM_STATUS_CHANGED
APPROVAL_TASK_ASSIGNED
APPROVAL_TASK_REASSIGNED
SYSTEM_MESSAGE
```

Future phases may add:

```text
GOODS_RECEIPT_REQUIRED
QUALITY_INSPECTION_REQUIRED
MATCHING_EXCEPTION
INVOICE_READY_FOR_REVIEW
ACCOUNTING_EXPORT_FAILED
```

---

# 7. List Current User Notifications

## Endpoint

```http
GET /api/v1/notifications
```

## Access

Authenticated user

## Purpose

Returns a paginated list of notifications belonging to the current user.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `status` | string | No | Filters by notification status |
| `notification_type` | string | No | Filters by notification type |
| `delivery_channel` | string | No | Filters by `IN_APP` or `EMAIL` |
| `unread_only` | boolean | No | Returns only unread notifications |
| `date_from` | date | No | Minimum creation date |
| `date_to` | date | No | Maximum creation date |
| `page` | integer | No | Page number, default `1` |
| `page_size` | integer | No | Page size, default `20`, maximum `100` |
| `sort_order` | string | No | `asc` or `desc`, default `desc` |

## Example Request

```http
GET /api/v1/notifications?unread_only=true&page=1&page_size=20
```

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "notification_id": 12001,
      "notification_type": "PURCHASE_ORDER_APPROVAL_REQUIRED",
      "title": "Purchase Order Approval Required",
      "message": "PO-2026-0001 requires your approval.",
      "related_entity_type": "PURCHASE_ORDER",
      "related_entity_id": 9001,
      "delivery_channel": "IN_APP",
      "status": "SENT",
      "read_at": null,
      "sent_at": "2026-08-06T10:00:05+10:00",
      "created_at": "2026-08-06T10:00:00+10:00"
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

- Invalid status values must be rejected.
- Invalid channel values must be rejected.
- `page` must be greater than zero.
- `page_size` must be between 1 and 100.
- Only notifications belonging to the authenticated user may be returned.

---

# 8. Get Notification Details

## Endpoint

```http
GET /api/v1/notifications/{notification_id}
```

## Access

Notification recipient or authorised administrator

## Success Response

```http
200 OK
```

```json
{
  "notification_id": 12001,
  "recipient_user_id": 1003,
  "notification_type": "PURCHASE_ORDER_APPROVAL_REQUIRED",
  "title": "Purchase Order Approval Required",
  "message": "PO-2026-0001 requires your approval.",
  "related_entity_type": "PURCHASE_ORDER",
  "related_entity_id": 9001,
  "delivery_channel": "IN_APP",
  "status": "SENT",
  "read_at": null,
  "sent_at": "2026-08-06T10:00:05+10:00",
  "failure_reason": null,
  "created_at": "2026-08-06T10:00:00+10:00",
  "navigation": {
    "resource_type": "PURCHASE_ORDER",
    "resource_id": 9001,
    "path": "/purchase-orders/9001"
  }
}
```

## Not Found Response

```http
404 Not Found
```

```json
{
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "The requested notification could not be found."
  }
}
```

A notification not owned by the current user may also return `404` to avoid revealing its existence.

---

# 9. Get Unread Notification Count

## Endpoint

```http
GET /api/v1/notifications/unread-count
```

## Access

Authenticated user

## Success Response

```http
200 OK
```

```json
{
  "unread_count": 5
}
```

This endpoint may be used by the application header or notification badge.

---

# 10. Mark Notification as Read

## Endpoint

```http
POST /api/v1/notifications/{notification_id}/read
```

## Access

Notification recipient

## Purpose

Marks a notification as read.

## Success Response

```http
200 OK
```

```json
{
  "notification_id": 12001,
  "status": "READ",
  "read_at": "2026-08-06T10:15:00+10:00"
}
```

## Behaviour

- The notification must belong to the current user.
- If already read, the endpoint should remain idempotent.
- `read_at` must be recorded.
- The original sent time must remain unchanged.

---

# 11. Mark Multiple Notifications as Read

## Endpoint

```http
POST /api/v1/notifications/mark-read
```

## Access

Authenticated user

## Request Body

```json
{
  "notification_ids": [
    12001,
    12002,
    12003
  ]
}
```

## Validation

- Each notification must belong to the current user.
- Duplicate IDs should be ignored.
- Unknown or unauthorised IDs must not expose another user's data.
- The operation should be atomic where practical.

## Success Response

```http
200 OK
```

```json
{
  "updated_count": 3,
  "read_at": "2026-08-06T10:20:00+10:00"
}
```

---

# 12. Mark All Notifications as Read

## Endpoint

```http
POST /api/v1/notifications/mark-all-read
```

## Access

Authenticated user

## Request Body

```json
{
  "before": "2026-08-06T10:30:00+10:00"
}
```

The `before` field is optional.

## Success Response

```http
200 OK
```

```json
{
  "updated_count": 8,
  "read_at": "2026-08-06T10:30:00+10:00"
}
```

## Behaviour

- Only the current user's unread notifications are updated.
- Already read notifications remain unchanged.
- The operation should be idempotent.

---

# 13. Navigate to Related Record

Notifications may reference related business records using:

```text
related_entity_type
related_entity_id
```

Supported initial related entity types:

```text
PURCHASE_REQUISITION
PURCHASE_ORDER
SUPPLIER
CATALOGUE_ITEM
APPROVAL_TASK
```

These fields provide navigation context only.

They are not the authoritative database relationship for approvals or status history.

The API may return a generated navigation path such as:

```json
{
  "resource_type": "PURCHASE_ORDER",
  "resource_id": 9001,
  "path": "/purchase-orders/9001"
}
```

The frontend must still enforce authorization before displaying the related record.

---

# 14. List Notification Delivery History

## Endpoint

```http
GET /api/v1/notifications/history
```

## Access

Procurement Manager or System Administrator

## Purpose

Returns notification delivery records for monitoring and troubleshooting.

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `recipient_user_id` | integer | No | Filters by recipient |
| `notification_type` | string | No | Filters by type |
| `status` | string | No | Filters delivery status |
| `delivery_channel` | string | No | Filters by channel |
| `related_entity_type` | string | No | Filters related entity type |
| `related_entity_id` | integer | No | Filters related record |
| `date_from` | date | No | Minimum creation date |
| `date_to` | date | No | Maximum creation date |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Page size |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "notification_id": 12001,
      "recipient": {
        "user_id": 1003,
        "first_name": "Taylor",
        "last_name": "Brown"
      },
      "notification_type": "PURCHASE_ORDER_APPROVAL_REQUIRED",
      "title": "Purchase Order Approval Required",
      "related_entity_type": "PURCHASE_ORDER",
      "related_entity_id": 9001,
      "delivery_channel": "IN_APP",
      "status": "SENT",
      "sent_at": "2026-08-06T10:00:05+10:00",
      "read_at": "2026-08-06T10:15:00+10:00",
      "failure_reason": null,
      "created_at": "2026-08-06T10:00:00+10:00"
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

# 15. List Failed Notifications

## Endpoint

```http
GET /api/v1/notifications/failures
```

## Access

Procurement Manager or System Administrator

## Query Parameters

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `delivery_channel` | string | No | Filters failed channel |
| `notification_type` | string | No | Filters notification type |
| `date_from` | date | No | Minimum failure date |
| `date_to` | date | No | Maximum failure date |
| `page` | integer | No | Page number |
| `page_size` | integer | No | Page size |

## Success Response

```http
200 OK
```

```json
{
  "items": [
    {
      "notification_id": 12009,
      "recipient_user_id": 1001,
      "notification_type": "PURCHASE_ORDER_APPROVED",
      "delivery_channel": "EMAIL",
      "status": "FAILED",
      "failure_reason": "Email service unavailable",
      "created_at": "2026-08-06T11:00:00+10:00"
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

# 16. Retry Failed Notification

## Endpoint

```http
POST /api/v1/notifications/{notification_id}/retry
```

## Access

System Administrator

## Request Body

```json
{
  "reason": "Email service restored"
}
```

## Validation

- Notification must exist.
- Current status must be `FAILED`.
- A retry reason is mandatory.
- The original notification content must not be changed silently.
- Retry attempts must be audited.
- The system must prevent uncontrolled repeated retries.

## Success Response

```http
202 Accepted
```

```json
{
  "notification_id": 12009,
  "status": "PENDING",
  "retry_accepted": true
}
```

## Invalid Status Response

```http
409 Conflict
```

```json
{
  "error": {
    "code": "NOTIFICATION_NOT_RETRYABLE",
    "message": "Only failed notifications can be retried."
  }
}
```

---

# 17. Notification Creation Behaviour

Notifications are normally created internally by workflow services.

Examples:

## Requisition Submission

The requisition service creates:

```text
REQUISITION_APPROVAL_REQUIRED
```

for the assigned approver.

## Requisition Decision

The service creates one of:

```text
REQUISITION_APPROVED
REQUISITION_REJECTED
REQUISITION_RETURNED
```

for the requester.

## Purchase Order Submission

The PO service creates:

```text
PURCHASE_ORDER_APPROVAL_REQUIRED
```

for the assigned approver.

## Purchase Order Decision

The service creates one of:

```text
PURCHASE_ORDER_APPROVED
PURCHASE_ORDER_REJECTED
PURCHASE_ORDER_RETURNED
```

for the Procurement Officer.

## Purchase Order Sent

The service may create:

```text
PURCHASE_ORDER_SENT
```

for relevant internal users.

Notification creation must occur within the same logical workflow transaction or through a reliable transactional-outbox approach when asynchronous delivery is introduced.

---

# 18. Internal Notification Creation Endpoint

Direct client creation of arbitrary notifications is not recommended.

An internal service endpoint may be provided:

```http
POST /api/v1/internal/notifications
```

This endpoint must not be exposed to normal frontend users.

## Example Internal Request

```json
{
  "recipient_user_id": 1003,
  "notification_type": "PURCHASE_ORDER_APPROVAL_REQUIRED",
  "title": "Purchase Order Approval Required",
  "message": "PO-2026-0001 requires your approval.",
  "related_entity_type": "PURCHASE_ORDER",
  "related_entity_id": 9001,
  "delivery_channel": "IN_APP"
}
```

Authentication between internal services must be secured.

---

# 19. Idempotency and Duplicate Prevention

Workflow retries must not create duplicate notifications.

Recommended duplicate controls may use:

- workflow event identifier
- recipient user
- notification type
- related entity
- event version

A duplicate workflow request should return or reuse the existing notification where appropriate.

---

# 20. Notification Retention

Notifications that form part of workflow evidence should not be permanently deleted through the normal API.

Future retention rules may archive older notifications according to:

- data-retention policy
- audit requirements
- storage limits
- regulatory obligations

The Phase 1 API will not provide a permanent-delete endpoint.

---

# 21. Privacy and Security

- Users may view only their own notifications unless authorised otherwise.
- Notification messages must not expose passwords, tokens or highly sensitive information.
- Email notifications should avoid unnecessary confidential data.
- Notification links must not bypass authorization checks.
- Failed-delivery reasons must not expose secrets.
- Administrative history access must be audited.

---

# 22. Notification Audit Events

The following events must be recorded:

```text
NOTIFICATION_CREATE
NOTIFICATION_SEND
NOTIFICATION_READ
NOTIFICATION_MARK_ALL_READ
NOTIFICATION_FAILED
NOTIFICATION_RETRY
NOTIFICATION_RETRY_FAILED
```

Audit details should include:

- Notification ID
- Recipient User ID
- Notification Type
- Delivery Channel
- Status
- Related entity where applicable
- User or system actor
- Date and time
- Request ID

---

# 23. Standard Error Codes

| Code | Meaning |
|---|---|
| `NOTIFICATION_NOT_FOUND` | Notification does not exist or is not visible |
| `NOTIFICATION_ACCESS_DENIED` | User cannot access the notification |
| `NOTIFICATION_INVALID_STATUS` | Invalid notification status supplied |
| `NOTIFICATION_INVALID_CHANNEL` | Unsupported delivery channel |
| `NOTIFICATION_NOT_RETRYABLE` | Notification is not in failed state |
| `NOTIFICATION_ALREADY_READ` | Notification was already read; may be treated idempotently |
| `NOTIFICATION_DELIVERY_FAILED` | Delivery attempt failed |
| `NOTIFICATION_DUPLICATE` | Equivalent workflow notification already exists |
| `NOTIFICATION_RELATED_ENTITY_INVALID` | Related entity information is invalid |

---

# 24. Standard Error Format

```json
{
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "The requested notification could not be found.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to API clients.
