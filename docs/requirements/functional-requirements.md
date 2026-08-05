# Procurement Functional Requirements

# 1. Purpose

This document defines the functional requirements for the NEXORA Procurement Management module.

The Procurement module supports supplier management, raw material and item catalogue management, supplier-item relationships, purchase requisitions, standard purchase orders, direct purchase orders, approval workflows, procurement status management, notifications and audit history for a food manufacturing organisation.

---

# 2. User Authentication

## FR-AUTH-001 — User Login

The system shall allow an active registered user to log in using a valid email address and password.

---

## FR-AUTH-002 — Invalid Login

The system shall reject invalid login credentials and display an appropriate error message.

---

## FR-AUTH-003 — Inactive User

The system shall prevent inactive users from logging in.

---

## FR-AUTH-004 — Role-Based Access

The system shall display menus, screens and functions according to the authenticated user's assigned role.

---

## FR-AUTH-005 — Logout

The system shall allow authenticated users to log out securely.

---

# 3. Supplier Management

## FR-SUP-001 — Create Supplier

The system shall allow authorised users to create supplier records.

---

## FR-SUP-002 — Supplier Information

The system shall capture the following supplier information:

- Supplier Code
- Supplier Name
- Supplier Status
- Contact Person
- Email Address
- Phone Number
- Address
- Payment Terms
- Notes

---

## FR-SUP-003 — Supplier Contacts

The system shall support multiple contacts for a supplier.

One contact may be designated as the Primary Contact.

---

## FR-SUP-004 — Unique Supplier Code

The system shall prevent duplicate Supplier Codes.

---

## FR-SUP-005 — Search Suppliers

The system shall allow users to search suppliers using:

- Supplier Code
- Supplier Name
- Status

---

## FR-SUP-006 — View Suppliers

The system shall display supplier details.

---

## FR-SUP-007 — Update Supplier

The system shall allow authorised users to update supplier information.

---

## FR-SUP-008 — Activate or Deactivate Supplier

The system shall allow authorised users to activate or deactivate suppliers.

---

## FR-SUP-009 — Active Supplier Validation

Only Active suppliers may be selected in procurement transactions.

---

## FR-SUP-010 — Supplier History

Supplier transaction history shall remain available after supplier deactivation.

---

# 4. Item Catalogue Management

## FR-ITEM-001 — Create Catalogue Item

The system shall allow authorised users to create catalogue items.

---

## FR-ITEM-002 — Item Information

The system shall maintain:

- Item Code
- Item Name
- Item Type
- Purchase Unit
- Stock Unit
- Unit Conversion
- Category
- Status

---

## FR-ITEM-003 — Unique Item Code

The system shall prevent duplicate Item Codes.

---

## FR-ITEM-004 — Item Categories

The system shall support the following item types:

- Raw Material
- Ingredient
- Packaging Material
- Cleaning Material
- Maintenance Item
- Non-Stock Item
- Service

---

## FR-ITEM-005 — Food Attributes

The system shall support food-related attributes including:

- Shelf Life
- Storage Conditions
- Batch Tracking
- Expiry Tracking
- Country of Origin
- Allergen Information

---

## FR-ITEM-006 — Search Catalogue

The system shall allow users to search catalogue items using:

- Item Code
- Item Name
- Category
- Status

---

## FR-ITEM-007 — Update Catalogue Item

The system shall allow authorised users to update catalogue items.

---

## FR-ITEM-008 — Activate or Deactivate Item

The system shall allow authorised users to activate or deactivate catalogue items.

---

## FR-ITEM-009 — Active Item Validation

Only Active catalogue items may be selected during procurement.

---

## FR-ITEM-010 — Unit Conversion

Where Purchase Units differ from Stock Units, the system shall maintain conversion factors.

---

# 5. Supplier-Item Catalogue

## FR-SITEM-001 — Link Supplier to Item

The system shall allow catalogue items to be linked to one or more suppliers.

---

## FR-SITEM-002 — Preferred Supplier

The system shall allow one supplier to be designated as the Preferred Supplier for a catalogue item.

---

## FR-SITEM-003 — Supplier Purchase Price

The system shall maintain supplier purchase prices.

---

## FR-SITEM-004 — Supplier Item Code

The system shall maintain supplier-specific item codes.

---

## FR-SITEM-005 — Purchase Unit

The system shall maintain supplier purchase units.

---

## FR-SITEM-006 — Minimum Order Quantity

The system shall maintain supplier minimum order quantities.

---

## FR-SITEM-007 — Lead Time

The system shall maintain expected supplier lead times.

---

## FR-SITEM-008 — Price History

The system shall retain historical supplier purchase prices.

---

## FR-SITEM-009 — Search Supplier Items

The system shall allow users to search supplier-item relationships.

---

## FR-SITEM-010 — Active Validation

Only Active suppliers and Active catalogue items may be linked.

---
# 6. Purchase Requisition Management

## FR-PR-001 — Create Purchase Requisition

The system shall allow authorised users to create Purchase Requisitions.

---

## FR-PR-002 — Requisition Information

The system shall capture:

- Requisition Number
- Requester
- Department
- Required Date
- Justification
- Status

---

## FR-PR-003 — Add Requisition Items

The system shall allow one or more catalogue items to be added to a Purchase Requisition.

---

## FR-PR-004 — Requisition Item Information

Each requisition line shall contain:

- Catalogue Item
- Description
- Quantity
- Purchase Unit
- Required Date

---

## FR-PR-005 — Save Draft

The system shall allow Purchase Requisitions to be saved as Draft.

---

## FR-PR-006 — Edit Draft

The system shall allow Draft or Returned for Amendment Purchase Requisitions to be edited.

---

## FR-PR-007 — Submit Requisition

The system shall allow valid Purchase Requisitions to be submitted.

---

## FR-PR-008 — Approval Decision

The system shall allow authorised Approvers to:

- Approve
- Reject
- Return for Amendment

---

## FR-PR-009 — Approval Comments

The system shall require comments when rejecting or returning a requisition.

---

## FR-PR-010 — Convert to Purchase Order

The system shall allow Approved Purchase Requisitions to be converted into Purchase Orders.

---

## FR-PR-011 — Cancel Requisition

The system shall allow eligible Purchase Requisitions to be cancelled.

---

## FR-PR-012 — View Requisition History

The system shall allow authorised users to view requisition history.

---

# 7. Purchase Order Management

## FR-PO-001 — Create Purchase Order

The system shall allow authorised Procurement Officers to create Purchase Orders from Approved Purchase Requisitions.

---

## FR-PO-002 — Direct Purchase Order

The system shall allow authorised Procurement Officers to create Direct Purchase Orders without a Purchase Requisition.

---

## FR-PO-003 — Purchase Order Number

The system shall automatically generate a unique Purchase Order Number.

---

## FR-PO-004 — Supplier Selection

The system shall allow users to select only Active suppliers.

---

## FR-PO-005 — Purchase Order Items

The system shall allow one or more catalogue items to be added to the Purchase Order.

---

## FR-PO-006 — Default Supplier Information

The system shall automatically populate:

- Supplier Item Code
- Purchase Unit
- Current Supplier Price

from the Supplier-Item Catalogue.

---

## FR-PO-007 — Purchase Order Calculations

The system shall automatically calculate:

- Line Total
- Purchase Order Total

---

## FR-PO-008 — Save Draft

The system shall allow Purchase Orders to be saved as Draft.

---

## FR-PO-009 — Edit Purchase Order

The system shall allow Draft and Returned for Amendment Purchase Orders to be edited.

---

## FR-PO-010 — Submit Purchase Order

The system shall validate mandatory information before allowing submission.

---

## FR-PO-011 — Purchase Order List

The system shall display Purchase Orders including:

- PO Number
- Supplier
- Created By
- Created Date
- Total Value
- Status

---

## FR-PO-012 — Search Purchase Orders

The system shall allow Purchase Orders to be searched using:

- PO Number
- Supplier
- Status
- Date Range

---

## FR-PO-013 — View Purchase Order

The system shall allow authorised users to view Purchase Order details.

---

## FR-PO-014 — Amend Purchase Order

The system shall allow Approved Purchase Orders to be amended through a controlled revision process.

---

## FR-PO-015 — Send to Supplier

The system shall allow Approved Purchase Orders to be generated and sent to suppliers.

---

## FR-PO-016 — Cancel Purchase Order

The system shall allow eligible Purchase Orders to be cancelled.

---

# 8. Approval Workflow

## FR-WF-001 — Auto Approval

The system shall automatically approve Purchase Orders below the configured approval threshold.

---

## FR-WF-002 — Manual Approval

The system shall route Purchase Orders at or above the configured approval threshold to the nominated Approver.

---

## FR-WF-003 — Configurable Threshold

The approval threshold shall be configurable.

---

## FR-WF-004 — Approval Decision

The system shall allow authorised Approvers to:

- Approve
- Reject
- Return for Amendment

---

## FR-WF-005 — Approval Comments

The system shall require comments when rejecting or returning Purchase Orders.

---

## FR-WF-006 — Prevent Self Approval

The system shall prevent users from approving Purchase Orders that they created.

---

## FR-WF-007 — Resubmission

Returned Purchase Orders may be edited and resubmitted.

---

# 9. Purchase Order Status Management

## FR-STAT-001 — Purchase Order Status

The system shall maintain the following Purchase Order statuses:

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

---

## FR-STAT-002 — Status Validation

The system shall only allow valid status transitions.

---

## FR-STAT-003 — Status History

Every Purchase Order status change shall be recorded.

---

# 10. Audit History

## FR-AUD-001 — Audit Trail

The system shall record the following procurement actions:

- Create
- Update
- Submit
- Approve
- Reject
- Return for Amendment
- Cancel
- Status Change

---

## FR-AUD-002 — Audit Information

Each audit record shall include:

- User
- Date
- Time
- Action
- Previous Value
- New Value

where applicable.

---

## FR-AUD-003 — View Audit History

The system shall allow authorised users to view procurement audit history.

---

# 11. Notifications

## FR-NOT-001 — Approval Notification

The system shall notify Approvers when procurement documents require approval.

---

## FR-NOT-002 — Decision Notification

The system shall notify Requesters and Procurement Officers after:

- Approval
- Rejection
- Return for Amendment

---

## FR-NOT-003 — Notification Log

The system shall record notification failures.

---

# 12. Phase 1 Scope

The Phase 1 Procurement module includes:

- User Authentication
- Role-Based Access Control
- Supplier Management
- Item Catalogue Management
- Supplier-Item Catalogue
- Purchase Requisitions
- Standard Purchase Orders
- Direct Purchase Orders
- Approval Workflow
- Purchase Order Status Management
- Audit History
- Notifications

---

# 13. Phase 1 Exclusions

The following functions are outside the scope of Phase 1:

- Goods Receipt
- Warehouse Management
- Inventory Management
- Batch Inventory Tracking
- Supplier Invoice Management
- Three-Way Matching
- Accounting Integration
- Payment Processing
- Multi-Currency
- Budget Management
- Manufacturing
- Production Planning
- Recipe Management
- Costing
- AI Procurement Assistant
