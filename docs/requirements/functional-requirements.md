# Procurement Functional Requirements

## 1. Purpose

This document defines the functional requirements for the NexusERP Procurement Management MVP.

The initial release will support:

- User authentication
- Supplier management
- Purchase order creation
- Purchase order submission
- Purchase order approval and rejection
- Purchase order status tracking
- Audit history

---

## 2. User Authentication

### FR-AUTH-001 — User Login

The system shall allow an active registered user to log in using a valid email address and password.

### FR-AUTH-002 — Invalid Login

The system shall reject invalid login credentials and display an appropriate error message.

### FR-AUTH-003 — Inactive User

The system shall prevent inactive users from logging in.

### FR-AUTH-004 — Role-Based Access

The system shall display and permit functions according to the authenticated user's assigned role.

### FR-AUTH-005 — Logout

The system shall allow an authenticated user to log out securely.

---

## 3. Supplier Management

### FR-SUP-001 — Create Supplier

The system shall allow a Procurement Officer or Administrator to create a supplier.

### FR-SUP-002 — Supplier Information

The system shall capture the following supplier information:

- Supplier code
- Supplier name
- Email address
- Phone number
- Address
- Status

### FR-SUP-003 — Unique Supplier Code

The system shall prevent the creation of duplicate supplier codes.

### FR-SUP-004 — View Suppliers

The system shall allow authorised users to view a list of suppliers.

### FR-SUP-005 — Search Suppliers

The system shall allow authorised users to search for suppliers by supplier code or supplier name.

### FR-SUP-006 — Update Supplier

The system shall allow authorised users to update supplier information.

### FR-SUP-007 — Supplier Status

The system shall allow authorised users to activate or deactivate a supplier.

### FR-SUP-008 — Inactive Supplier Restriction

The system shall prevent inactive suppliers from being selected for new purchase orders.

---

## 4. Purchase Order Management

### FR-PO-001 — Create Purchase Order

The system shall allow a Procurement Officer to create a purchase order.

### FR-PO-002 — Purchase Order Number

The system shall automatically generate a unique purchase order number.

### FR-PO-003 — Select Supplier

The system shall allow the user to select an active supplier for the purchase order.

### FR-PO-004 — Add Purchase Order Items

The system shall allow the user to add one or more purchase order items.

### FR-PO-005 — Purchase Order Item Information

Each purchase order item shall include:

- Product code
- Product description
- Quantity
- Unit price
- Line total

### FR-PO-006 — Calculate Line Total

The system shall automatically calculate each line total as:

`quantity × unit price`

### FR-PO-007 — Calculate Purchase Order Total

The system shall automatically calculate the purchase order total as the sum of all line totals.

### FR-PO-008 — Save Draft

The system shall allow the Procurement Officer to save a purchase order as a draft.

### FR-PO-009 — Edit Purchase Order

The system shall allow a Procurement Officer to edit purchase orders with the status `Draft` or `Rejected`.

### FR-PO-010 — View Purchase Order

The system shall allow authorised users to view purchase-order details.

### FR-PO-011 — List Purchase Orders

The system shall display a list of purchase orders with:

- Purchase order number
- Supplier
- Created date
- Created by
- Total value
- Status

### FR-PO-012 — Filter Purchase Orders

The system shall allow users to filter purchase orders by status, supplier, purchase-order number, and date.

---

## 5. Submission and Approval Workflow

### FR-WF-001 — Submit Purchase Order

The system shall allow a Procurement Officer to submit a valid draft purchase order for approval.

### FR-WF-002 — Submission Validation

The system shall validate all mandatory information before allowing submission.

### FR-WF-003 — Submitted Status

The system shall change the purchase-order status from `Draft` to `Submitted` after successful submission.

### FR-WF-004 — Manager Review

The system shall allow a Procurement Manager to view submitted purchase orders awaiting review.

### FR-WF-005 — Approve Purchase Order

The system shall allow a Procurement Manager to approve a submitted purchase order.

### FR-WF-006 — Prevent Self-Approval

The system shall prevent a user from approving a purchase order that they created.

### FR-WF-007 — Reject Purchase Order

The system shall allow a Procurement Manager to reject a submitted purchase order.

### FR-WF-008 — Rejection Reason

The system shall require a rejection reason when a purchase order is rejected.

### FR-WF-009 — Approved Status

The system shall change the status to `Approved` after approval.

### FR-WF-010 — Rejected Status

The system shall change the status to `Rejected` after rejection.

### FR-WF-011 — Approved Order Protection

The system shall prevent approved purchase orders from being edited.

### FR-WF-012 — Resubmit Rejected Order

The system shall allow a Procurement Officer to edit and resubmit a rejected purchase order.

### FR-WF-013 — Cancel Purchase Order

The system shall allow an authorised user to cancel a purchase order with the status `Draft` or `Rejected`.

---

## 6. Audit and Status History

### FR-AUD-001 — Status History

The system shall record every purchase-order status change.

### FR-AUD-002 — Audit Information

Each audit-history record shall contain:

- Purchase-order number
- Previous status
- New status
- Action performed
- User
- Date and time
- Comments or rejection reason

### FR-AUD-003 — View History

The system shall allow authorised users to view the status history of a purchase order.

---

## 7. Notifications

### FR-NOT-001 — Submission Notification

The system shall notify the Procurement Manager when a purchase order is submitted.

### FR-NOT-002 — Approval Notification

The system shall notify the Procurement Officer when a purchase order is approved.

### FR-NOT-003 — Rejection Notification

The system shall notify the Procurement Officer when a purchase order is rejected and include the rejection reason.

Notifications may initially be displayed inside the application. Email notifications may be added in a future version.

---

## 8. MVP Exclusions

The following functions are outside the initial MVP scope:

- Purchase requisitions
- Product master management
- Goods receipt
- Inventory updates
- Supplier invoicing
- Financial posting
- Multi-currency processing
- Tax calculation
- Multi-level approvals
- Budget validation
- Email notifications
- AI approval decisions
