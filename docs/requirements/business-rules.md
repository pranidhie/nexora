# Procurement Business Rules

## Overview

This document defines the business rules for the NEXORA Procurement Management module.

The Procurement module manages suppliers, raw material catalogues, supplier-item relationships, purchase requisitions, purchase orders, direct purchase orders, approval workflows, procurement statuses, notifications and audit history for a food manufacturing organisation.

---

# Security Rules

## BR-SEC-001 — Authentication

Only authenticated users may access the Procurement module.

## BR-SEC-002 — Role-Based Access

The system shall enforce permissions based on the user's assigned role.

## BR-SEC-003 — Self Approval

A user must not approve a procurement document that they created.

## BR-SEC-004 — Inactive Users

Inactive users must not be permitted to log in or perform procurement activities.

---

# Supplier Rules

## BR-SUP-001 — Supplier Name

A supplier must have a Supplier Name.

## BR-SUP-002 — Unique Supplier Code

Each supplier must have a unique Supplier Code.

## BR-SUP-003 — Supplier Status

Only Active suppliers may be selected for new procurement transactions.

## BR-SUP-004 — Supplier Email

If an email address is provided, it must be in a valid email format.

## BR-SUP-005 — Supplier Deactivation

Suppliers with procurement history must be deactivated rather than permanently deleted.

## BR-SUP-006 — Supplier Contacts

A supplier may have multiple contacts.

One contact may be designated as the Primary Contact.

---

# Item Catalogue Rules

## BR-ITEM-001 — Unique Item Code

Each catalogue item must have a unique Item Code.

## BR-ITEM-002 — Mandatory Item Name

Each catalogue item must have an Item Name.

## BR-ITEM-003 — Active Items

Only Active catalogue items may be selected in procurement transactions.

## BR-ITEM-004 — Purchase Unit

Every catalogue item must have a Purchase Unit of Measure.

## BR-ITEM-005 — Stock Unit

Stock items must have a Stock Unit of Measure.

## BR-ITEM-006 — Unit Conversion

If the Purchase Unit differs from the Stock Unit, a Unit Conversion Factor is mandatory.

## BR-ITEM-007 — Food Attributes

Raw materials may contain:

- Shelf Life
- Storage Conditions
- Batch Tracking
- Expiry Tracking
- Country of Origin
- Allergen Information

---

# Supplier Item Rules

## BR-SITEM-001 — Supplier Relationship

One catalogue item may be linked to multiple suppliers.

## BR-SITEM-002 — Preferred Supplier

One supplier may be designated as the Preferred Supplier for an item.

## BR-SITEM-003 — Supplier Price

Supplier purchase prices must maintain historical records.

## BR-SITEM-004 — Minimum Order Quantity

A supplier may define a Minimum Order Quantity.

## BR-SITEM-005 — Lead Time

A supplier may define an expected Lead Time.

---

# Purchase Requisition Rules

## BR-PR-001 — Requisition Items

A Purchase Requisition must contain at least one item.

## BR-PR-002 — Mandatory Information

Each requisition line must contain:

- Item
- Quantity
- Required Date

## BR-PR-003 — Draft Editing

Only Draft or Returned for Amendment requisitions may be edited.

## BR-PR-004 — Submission

Only valid requisitions may be submitted.

## BR-PR-005 — Purchase Order Creation

Only Approved Purchase Requisitions may be converted into Purchase Orders.

## BR-PR-006 — Cancellation

Cancelled requisitions cannot be converted into Purchase Orders.

---

# Purchase Order Rules

## BR-PO-001 — Purchase Order Source

A Standard Purchase Order must originate from an Approved Purchase Requisition.

## BR-PO-002 — Active Supplier

A Purchase Order must reference an Active supplier.

## BR-PO-003 — Purchase Order Items

A Purchase Order must contain at least one item.

## BR-PO-004 — Quantity

Item quantity must be greater than zero.

## BR-PO-005 — Unit Price

Unit Price must be zero or greater.

## BR-PO-006 — Line Total

The Line Total shall equal:

Quantity × Unit Price

## BR-PO-007 — Purchase Order Total

The Purchase Order Total shall equal the sum of all Line Totals.

## BR-PO-008 — Initial Status

A newly created Purchase Order shall have the status:

Draft

## BR-PO-009 — Draft Editing

Only Draft or Returned for Amendment Purchase Orders may be edited.

## BR-PO-010 — Supplier Pricing

Supplier catalogue pricing should populate the Purchase Order by default.

## BR-PO-011 — Price Override

Only authorised users may override supplier pricing.

## BR-PO-012 — Submission

Only valid Purchase Orders may be submitted.

## BR-PO-013 — Approved Purchase Orders

Approved Purchase Orders must not be directly edited.

Changes must be performed through a controlled amendment process.

## BR-PO-014 — Send to Supplier

Only Approved Purchase Orders may be sent to suppliers.

## BR-PO-015 — Purchase Order Cancellation

Only eligible Purchase Orders may be cancelled.

A cancellation reason is mandatory.

---

# Approval Rules

## BR-APP-001 — Auto Approval

Purchase Orders below the configured approval threshold shall be automatically approved.

## BR-APP-002 — Manual Approval

Purchase Orders equal to or greater than the configured approval threshold require approval.

## BR-APP-003 — Configurable Threshold

The approval threshold must be configurable.

## BR-APP-004 — Approval Authority

Only authorised Approvers may approve Purchase Orders.

## BR-APP-005 — Rejection Reason

A rejection reason is mandatory.

## BR-APP-006 — Returned Purchase Orders

Returned Purchase Orders may be edited and resubmitted.

---

# Direct Purchase Order Rules

## BR-DPO-001 — Direct Purchase

A Direct Purchase Order may be created without a Purchase Requisition.

## BR-DPO-002 — Mandatory Reason

Every Direct Purchase Order must contain a Direct Purchase Reason.

## BR-DPO-003 — Approval

Direct Purchase Orders follow the same approval workflow as Standard Purchase Orders.

---

# Purchase Order Status Rules

## BR-STAT-001 — Valid Statuses

Purchase Orders may use the following statuses:

- Draft
- Submitted
- Pending Approval
- Returned for Amendment
- Approved
- Rejected
- Cancelled
- On Hold
- Sent to Supplier
- Closed

## BR-STAT-002 — Valid Status Transitions

The system shall only allow approved status transitions.

Invalid status changes shall be rejected.

---

# Audit Rules

## BR-AUD-001 — Audit History

The following actions must be recorded:

- Create
- Update
- Submit
- Approve
- Reject
- Return for Amendment
- Cancel
- Status Change

## BR-AUD-002 — Audit Information

Each audit record shall contain:

- User
- Date
- Time
- Action
- Previous Value
- New Value

where applicable.

## BR-AUD-003 — Audit Protection

Standard users must not modify or delete audit records.

---

# Notification Rules

## BR-NOT-001 — Approval Notification

Approvers shall be notified when approval is required.

## BR-NOT-002 — Decision Notification

Requesters and Procurement Officers shall be notified after approval, rejection or return.

## BR-NOT-003 — Failed Notifications

Notification failures shall be logged.
