# Procurement Business Rules

## Overview

This document defines the business rules for the NexusERP Procurement Management MVP. These rules control supplier management, purchase order creation, validation, submission, approval, rejection, and access permissions.

## Supplier Rules

### BR-SUP-001 — Supplier name

A supplier must have a supplier name.

### BR-SUP-002 — Unique supplier code

Each supplier must have a unique supplier code.

### BR-SUP-003 — Supplier status

Only active suppliers may be selected for new purchase orders.

### BR-SUP-004 — Supplier email

When an email address is provided, it must use a valid email format.

### BR-SUP-005 — Supplier deactivation

A supplier with existing purchase-order history must be deactivated rather than permanently deleted.

## Purchase Order Rules

### BR-PO-001 — Active supplier

A purchase order must be associated with an active supplier.

### BR-PO-002 — Purchase order items

A purchase order must contain at least one item before submission.

### BR-PO-003 — Quantity

The quantity of every purchase order item must be greater than zero.

### BR-PO-004 — Unit price

The unit price must be zero or greater.

### BR-PO-005 — Line total

The line total must be calculated as:

`quantity × unit price`

### BR-PO-006 — Purchase order total

The purchase order total must equal the sum of all purchase order line totals.

### BR-PO-007 — Initial status

A newly created purchase order must have the status `Draft`.

### BR-PO-008 — Draft editing

Only purchase orders with the status `Draft` or `Rejected` may be edited.

### BR-PO-009 — Submission

Only a Procurement Officer may submit a valid purchase order.

### BR-PO-010 — Approval access

Only a Procurement Manager or authorised Administrator may approve a submitted purchase order.

### BR-PO-011 — Rejection access

Only a Procurement Manager or authorised Administrator may reject a submitted purchase order.

### BR-PO-012 — Rejection reason

A rejection reason is mandatory when a purchase order is rejected.

### BR-PO-013 — Approved order protection

An approved purchase order must not be edited.

### BR-PO-014 — Status transitions

The system must only allow the following status transitions:

| Current Status | Action | New Status |
|---|---|---|
| Draft | Submit | Submitted |
| Submitted | Approve | Approved |
| Submitted | Reject | Rejected |
| Rejected | Edit | Draft |
| Draft | Cancel | Cancelled |
| Rejected | Cancel | Cancelled |

### BR-PO-015 — Audit history

Every submission, approval, rejection, cancellation, and status change must be recorded in the audit history.

## Security Rules

### BR-SEC-001 — Authentication

Only authenticated users may access the Procurement Management module.

### BR-SEC-002 — Role-based access

The system must enforce permissions based on the user's assigned role.

### BR-SEC-003 — Self-approval

A user must not approve a purchase order that they created.

### BR-SEC-004 — Inactive users

Inactive users must not be allowed to log in or perform procurement activities.

## Future Rules

Future versions may include:

- Approval thresholds based on purchase order value
- Multi-level approvals
- Currency conversion
- Tax calculations
- Budget validation
- Contract-price validation
- Duplicate purchase-order detection
- Goods-receipt validation
- Three-way invoice matching
