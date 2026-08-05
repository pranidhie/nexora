# NEXORA Procurement User Stories

## Epic

### PROC-EPIC-001 — Food Manufacturing Procurement Management

Develop the NEXORA Procurement module to manage suppliers, raw materials,
purchase requisitions, purchase orders, approval workflows, statuses and
procurement audit history for a food manufacturing organisation.

---

# Authentication and Access Control

## US-PROC-001 — User Login

**As a** registered user  
**I want to** securely log in to NEXORA  
**So that** I can access functions permitted by my role.

### Acceptance Criteria

- Valid credentials redirect the user to the dashboard.
- Invalid credentials display an error message.
- Access is restricted according to the assigned role.
- The login date and time are recorded.

**Priority:** High

---

## US-PROC-002 — Role-Based Access Control

**As a** System Administrator  
**I want to** assign roles and permissions  
**So that** users can perform only authorised procurement activities.

### Acceptance Criteria

- The system supports Requester, Procurement Officer, Procurement Manager,
  Nominated Approver, Warehouse Officer, Quality Officer and Administrator roles.
- Permissions control viewing, creating, editing, submitting, approving,
  rejecting and cancelling.
- Unauthorised actions are blocked.
- Permission changes are audited.

**Priority:** High

---

# Supplier Management

## US-PROC-003 — Create Supplier

**As a** Procurement Officer  
**I want to** create a supplier  
**So that** the supplier can be used for purchasing.

### Acceptance Criteria

- Supplier Code and Supplier Name are mandatory.
- Supplier Code must be unique.
- The initial status is Active.
- The creator and creation time are recorded.

**Priority:** High

---

## US-PROC-004 — Search and View Supplier

**As a** Procurement Officer  
**I want to** search and view suppliers  
**So that** I can locate supplier information.

### Acceptance Criteria

- Search is available by Supplier Code and Supplier Name.
- Users can filter by status.
- Results display Supplier Code, Supplier Name and Status.
- Supplier details and transaction history can be viewed.

**Priority:** High

---

## US-PROC-005 — Update Supplier

**As a** Procurement Officer  
**I want to** update supplier information  
**So that** supplier records remain accurate.

### Acceptance Criteria

- Authorised fields can be updated.
- A duplicate Supplier Code is rejected.
- The updater and update time are recorded.
- Changes are included in the audit history.

**Priority:** Medium

---

## US-PROC-006 — Deactivate Supplier

**As a** Procurement Manager  
**I want to** deactivate a supplier  
**So that** it cannot be selected for new purchases.

### Acceptance Criteria

- Supplier status can be changed to Inactive.
- Inactive suppliers cannot be selected for new transactions.
- Historical transactions remain available.
- The deactivation action is audited.

**Priority:** Medium

---

## US-PROC-007 — Maintain Supplier Contacts

**As a** Procurement Officer  
**I want to** maintain supplier contacts  
**So that** purchase documents are sent to the correct person.

### Acceptance Criteria

- Multiple contacts can be recorded.
- One contact can be marked as primary.
- Email and telephone details can be maintained.
- Contact changes are audited.

**Priority:** Medium

---

# Raw Material and Item Catalogue

## US-PROC-008 — Create Catalogue Item

**As a** Procurement Officer  
**I want to** create a catalogue item  
**So that** approved materials and services can be purchased.

### Acceptance Criteria

- Item Code and Item Name are mandatory.
- Item Code must be unique.
- Item Type and Purchase Unit are mandatory.
- The initial status is Active.
- The creator and creation time are recorded.

**Priority:** High

---

## US-PROC-009 — Classify Catalogue Item

**As a** Procurement Officer  
**I want to** classify each catalogue item  
**So that** materials are managed according to their purpose.

### Acceptance Criteria

- Supported types include Raw Material, Ingredient, Packaging Material,
  Cleaning Material, Maintenance Item, Non-Stock Item and Service.
- An item category can be assigned.
- The classification appears in searches and purchase documents.

**Priority:** High

---

## US-PROC-010 — Search and View Catalogue Item

**As a** Procurement Officer  
**I want to** search and view catalogue items  
**So that** I can select the correct item for purchasing.

### Acceptance Criteria

- Search is available by Item Code and Item Name.
- Users can filter by type, category and status.
- Results show Item Code, Item Name, Type and Purchase Unit.
- Inactive items are clearly identified.

**Priority:** High

---

## US-PROC-011 — Update or Deactivate Catalogue Item

**As a** Procurement Officer  
**I want to** update or deactivate catalogue items  
**So that** the catalogue remains accurate.

### Acceptance Criteria

- Authorised item fields can be updated.
- Duplicate Item Codes are rejected.
- Inactive items cannot be added to new purchase transactions.
- Existing transaction history remains available.
- Changes are audited.

**Priority:** Medium

---

## US-PROC-012 — Maintain Units of Measure

**As a** System Administrator  
**I want to** maintain units of measure  
**So that** items can be purchased and received correctly.

### Acceptance Criteria

- Units such as kilogram, litre, carton, pallet and each can be maintained.
- Unit codes must be unique.
- Inactive units cannot be selected for new items.
- Historical transactions remain valid.

**Priority:** High

---

## US-PROC-013 — Maintain Purchase and Stock Units

**As a** Procurement Officer  
**I want to** define purchase and stock units  
**So that** items can be ordered and stored in different units.

### Acceptance Criteria

- Each stock item has a Stock Unit.
- A Purchase Unit may differ from the Stock Unit.
- A conversion factor is mandatory when units differ.
- Zero or negative conversion factors are rejected.

**Priority:** High

---

## US-PROC-014 — Maintain Food Material Attributes

**As a** Procurement or Quality Officer  
**I want to** maintain food-related item information  
**So that** purchasing considers food-safety requirements.

### Acceptance Criteria

- Shelf life can be recorded.
- Storage conditions can be recorded.
- Batch tracking and expiry tracking can be marked as required.
- Allergen and country-of-origin information can be recorded.
- Changes are audited.

**Priority:** Medium

---

# Supplier–Item Catalogue

## US-PROC-015 — Link Item to Supplier

**As a** Procurement Officer  
**I want to** link items to approved suppliers  
**So that** permitted supplier-item combinations can be used.

### Acceptance Criteria

- An item can be linked to multiple suppliers.
- Only active suppliers and active items can be linked.
- One supplier can be marked as preferred.
- Historical links remain available.

**Priority:** High

---

## US-PROC-016 — Maintain Supplier Item Details

**As a** Procurement Officer  
**I want to** maintain supplier-specific purchasing details  
**So that** correct information is used on purchase orders.

### Acceptance Criteria

- Supplier Item Code can be recorded.
- Purchase price and purchase unit can be recorded.
- Minimum order quantity and lead time can be recorded.
- Changes to price are retained in price history.

**Priority:** High

---

# Purchase Requisitions

## US-PROC-017 — Create Purchase Requisition

**As a** Requesting Employee  
**I want to** create a purchase requisition  
**So that** I can request materials or services.

### Acceptance Criteria

- At least one item is required.
- Item, quantity, required date and estimated price are recorded.
- Totals are calculated automatically.
- A unique requisition number is generated.
- The initial status is Draft.

**Priority:** High

---

## US-PROC-018 — Edit Draft Purchase Requisition

**As a** Requesting Employee  
**I want to** edit a draft requisition  
**So that** I can correct it before submission.

### Acceptance Criteria

- Only Draft or Returned for Amendment requisitions can be edited.
- Item, quantity, price and required date can be changed.
- Totals recalculate automatically.
- Changes are audited.

**Priority:** High

---

## US-PROC-019 — Submit Purchase Requisition

**As a** Requesting Employee  
**I want to** submit a requisition  
**So that** it can be reviewed.

### Acceptance Criteria

- Mandatory information is validated.
- Status changes to Submitted or Pending Approval.
- The nominated approver is notified.
- Submission is recorded in history.

**Priority:** High

---

## US-PROC-020 — Approve, Reject or Return Requisition

**As a** nominated approver  
**I want to** decide on a requisition  
**So that** valid requests can proceed.

### Acceptance Criteria

- The approver can Approve, Reject or Return for Amendment.
- A reason is mandatory for rejection or return.
- The requester is notified.
- The decision is recorded in audit history.
- Users cannot approve their own requisitions where separation of duties applies.

**Priority:** High

---

## US-PROC-021 — Cancel Purchase Requisition

**As an** authorised user  
**I want to** cancel an eligible requisition  
**So that** an unnecessary request does not proceed.

### Acceptance Criteria

- Only eligible requisitions can be cancelled.
- A cancellation reason is mandatory.
- Cancelled requisitions cannot be converted to a purchase order.
- The cancellation is audited.

**Priority:** Medium

---

# Standard Purchase Orders

## US-PROC-022 — Create PO from Approved Requisition

**As a** Procurement Officer  
**I want to** create a purchase order from an approved requisition  
**So that** goods or services can be ordered.

### Acceptance Criteria

- The source requisition is Approved.
- Only active approved suppliers can be selected.
- Catalogue items and requested quantities are transferred to the PO.
- A unique PO number is generated.
- The PO is linked to its requisition.
- The initial status is Draft.

**Priority:** High

---

## US-PROC-023 — Edit Draft Purchase Order

**As a** Procurement Officer  
**I want to** edit a draft or returned purchase order  
**So that** it can be corrected before approval.

### Acceptance Criteria

- Draft and Returned for Amendment POs can be edited.
- Items, quantities, prices and delivery details can be changed.
- Totals recalculate automatically.
- Approved or sent POs cannot be directly overwritten.
- Changes are audited.

**Priority:** High

---

## US-PROC-024 — Apply Supplier Catalogue Information

**As a** Procurement Officer  
**I want** supplier-specific item information applied to a PO  
**So that** correct codes, units and prices are used.

### Acceptance Criteria

- Supplier Item Code defaults from the supplier-item catalogue.
- Purchase Unit and current price are applied.
- Minimum-order rules are validated.
- Price overrides require permission and are audited.

**Priority:** High

---

## US-PROC-025 — Submit Purchase Order

**As a** Procurement Officer  
**I want to** submit a purchase order  
**So that** the appropriate approval rule is applied.

### Acceptance Criteria

- Mandatory information is validated.
- The supplier and items must be active.
- The PO total is calculated.
- The configured approval threshold is evaluated.
- Submission is audited.

**Priority:** High

---

## US-PROC-026 — Auto-Approve Low-Value Purchase Order

**As a** Procurement Officer  
**I want** eligible low-value POs to be automatically approved  
**So that** unnecessary manual approval is avoided.

### Acceptance Criteria

- A PO below AUD 1,000 is auto-approved.
- The threshold is configurable.
- The approval source is recorded as System.
- Status changes to Approved.

**Priority:** High

---

## US-PROC-027 — Route High-Value PO for Approval

**As a** Procurement Officer  
**I want** a PO of AUD 1,000 or more routed to a nominated approver  
**So that** higher-value purchases are controlled.

### Acceptance Criteria

- The system detects when the configured threshold is reached.
- Status changes to Pending Approval.
- The nominated approver is notified.
- The routing event is recorded.

**Priority:** High

---

## US-PROC-028 — Approve, Reject or Return Purchase Order

**As a** nominated approver  
**I want to** decide on a submitted purchase order  
**So that** only valid orders proceed.

### Acceptance Criteria

- The approver can Approve, Reject or Return for Amendment.
- Reasons are mandatory for rejection and return.
- The Procurement Officer is notified.
- The decision is recorded.
- Separation-of-duties rules are enforced.

**Priority:** High

---

## US-PROC-029 — Send Approved PO to Supplier

**As a** Procurement Officer  
**I want to** generate and send an approved PO  
**So that** the supplier can fulfil it.

### Acceptance Criteria

- Only Approved POs can be sent.
- A PO document is generated.
- The recipient and send time are recorded.
- Status changes to Sent to Supplier.

**Priority:** High

---

## US-PROC-030 — Amend Approved Purchase Order

**As an** authorised Procurement Officer  
**I want to** amend an approved PO through a controlled revision  
**So that** changes do not overwrite the approved record.

### Acceptance Criteria

- The original approved PO remains unchanged.
- An amendment reason is mandatory.
- A revision number is created.
- Material changes require reapproval.
- Full revision history remains visible.

**Priority:** High

---

## US-PROC-031 — Cancel or Place PO on Hold

**As an** authorised user  
**I want to** cancel or place an eligible PO on hold  
**So that** processing can be stopped when required.

### Acceptance Criteria

- A reason is mandatory.
- Status changes to Cancelled or On Hold.
- Invalid actions are prevented based on receipt or invoice status.
- The action is audited.

**Priority:** Medium

---

## US-PROC-032 — Maintain PO Status and History

**As a** procurement user  
**I want** PO status and history maintained automatically  
**So that** the current lifecycle stage is clear.

### Acceptance Criteria

- Only valid status transitions are allowed.
- Each change records user, date, time and comments.
- Current status appears in searches and detail screens.
- Status history cannot be edited by standard users.

**Priority:** High

---

# Direct Purchase Orders

## US-PROC-033 — Create Direct Purchase Order

**As a** Procurement Officer  
**I want to** create a DPO without a requisition  
**So that** authorised direct purchases can be processed.

### Acceptance Criteria

- A DPO can be created without a requisition.
- A direct-purchase reason is mandatory.
- Only active suppliers and items can be selected.
- A unique document number is generated.
- The order is identified as DPO.
- The initial status is Draft.

**Priority:** High

---

## US-PROC-034 — Process Direct Purchase Order

**As a** Procurement Officer or nominated approver  
**I want** a DPO to follow editing, submission and approval controls  
**So that** direct purchases remain governed.

### Acceptance Criteria

- Draft or returned DPOs can be edited.
- The configured approval threshold is applied.
- The approver can Approve, Reject or Return the DPO.
- Only Approved DPOs can be sent to the supplier.
- All decisions are audited.

**Priority:** High

---

# Audit and Notifications

## US-PROC-035 — Maintain Procurement Audit Trail

**As an** Auditor  
**I want** important actions to be recorded  
**So that** procurement activity is traceable.

### Acceptance Criteria

- Create, update, submit, approve, reject, return, amend and cancel actions are recorded.
- Old and new values are recorded for significant changes.
- User, date, time and action are recorded.
- Standard users cannot modify audit records.

**Priority:** High

---

## US-PROC-036 — Send Workflow Notifications

**As a** procurement user  
**I want to** receive workflow notifications  
**So that** I know when action is required.

### Acceptance Criteria

- Approvers are notified of pending decisions.
- Requesters and Procurement Officers are notified of decisions.
- Notifications link to the related record.
- Failed notifications are logged.

**Priority:** Medium
