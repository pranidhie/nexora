# Procurement User Stories

## Epic

**PROC-EPIC-001 – Procurement Management**

Develop a Procurement Management module that enables suppliers and purchase orders to be created, reviewed, approved, and tracked.

---

# Authentication

## US-001 – User Login

**As a** registered user

**I want** to securely log into NexusERP

**So that** I can access functions based on my assigned role.

### Acceptance Criteria

- User enters valid email and password.
- User is authenticated.
- User is redirected to the dashboard.
- Invalid credentials display an error message.

---

# Supplier Management

## US-002 – Create Supplier

**As a** Procurement Officer

**I want** to create a supplier

**So that** the supplier can be used in purchase orders.

### Acceptance Criteria

- Supplier Code is mandatory.
- Supplier Name is mandatory.
- Supplier Code must be unique.
- Supplier is created successfully.

---

## US-003 – Search Supplier

**As a** Procurement Officer

**I want** to search suppliers

**So that** I can quickly find supplier information.

### Acceptance Criteria

- Search by Supplier Code.
- Search by Supplier Name.
- Results returned quickly.

---

# Purchase Orders

## US-004 – Create Purchase Order

**As a** Procurement Officer

**I want** to create a Purchase Order

**So that** I can request goods from suppliers.

### Acceptance Criteria

- Active supplier selected.
- One or more items added.
- Totals calculated automatically.
- Draft status assigned.

---

## US-005 – Submit Purchase Order

**As a** Procurement Officer

**I want** to submit a Purchase Order

**So that** a manager can review it.

### Acceptance Criteria

- Validation passes.
- Status changes to Submitted.
- Manager notification generated.

---

## US-006 – Approve Purchase Order

**As a** Procurement Manager

**I want** to approve submitted Purchase Orders

**So that** procurement can continue.

### Acceptance Criteria

- Purchase Order status becomes Approved.
- Audit history updated.
- Procurement Officer notified.

---

## US-007 – Reject Purchase Order

**As a** Procurement Manager

**I want** to reject a Purchase Order

**So that** incorrect orders can be corrected.

### Acceptance Criteria

- Rejection reason mandatory.
- Status becomes Rejected.
- Procurement Officer notified.

---

# Reporting

## US-008 – View Purchase Order History

**As a** Procurement Officer

**I want** to view Purchase Order history

**So that** I can track approvals and status changes.

### Acceptance Criteria

- Status history displayed.
- User shown.
- Date and time displayed.
- Comments displayed.
