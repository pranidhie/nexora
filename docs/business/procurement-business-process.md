# Procurement Business Process

# 1. Purpose

This document describes the end-to-end procurement business process for the NEXORA Procurement Management module.

The process defines how procurement requests are initiated, approved, converted into purchase orders and managed throughout their lifecycle.

This business process forms the foundation for the database design, APIs, user interface, business rules and future AI capabilities.

---

# 2. Procurement Process Overview

The procurement process consists of the following stages:

1. Purchase Requirement
2. Purchase Requisition
3. Requisition Approval
4. Purchase Order Creation
5. Purchase Order Approval
6. Purchase Order Issuing
7. Future Procurement Stages

---

# 3. Business Actors

The following business roles participate in the procurement process.

| Role | Responsibility |
|------|----------------|
| Requester | Requests materials or services |
| Procurement Officer | Creates and manages Purchase Orders |
| Approver | Reviews and approves procurement documents |
| Supplier | Supplies requested goods or services |
| Warehouse Officer *(Future)* | Receives goods |
| Quality Officer *(Future)* | Performs quality inspection |
| Finance Officer *(Future)* | Processes supplier invoices |

---

# 4. End-to-End Procurement Workflow

```

Need Identified
        │
        ▼
Purchase Requisition Created
        │
        ▼
Submitted for Approval
        │
        ▼
───────────────
Approve?
───────────────
     │
 ┌───┴────┐
 │        │
Yes       No
 │        │
 ▼        ▼
Approved  Rejected
 │
 ▼
Purchase Order Created
 │
 ▼
Submitted for Approval
 │
 ▼
───────────────
Approve?
───────────────
     │
 ┌───┴────┐
 │        │
Yes       Return
 │        │
 ▼        ▼
Approved  Returned for Amendment
 │               │
 ▼               │
Sent to Supplier │
 │               │
 ▼               │
Future Phase ◄───┘

```

---

# 5. Business Process Description

## Step 1 — Need Identified

A business area identifies the need to purchase materials, products or services.

Example:

- Flour
- Cooking Oil
- Packaging
- Cleaning Chemicals
- Equipment

Output

Purchase Requirement

---

## Step 2 — Purchase Requisition

The Requester creates a Purchase Requisition.

Information includes:

- Required items
- Quantities
- Required Date
- Business Justification

Output

Draft Purchase Requisition

---

## Step 3 — Requisition Approval

The Purchase Requisition is submitted.

Possible outcomes

- Approved
- Rejected
- Returned for Amendment

If approved, Procurement can create a Purchase Order.

---

## Step 4 — Purchase Order Creation

Procurement creates a Purchase Order using the Approved Purchase Requisition.

The Purchase Order includes:

- Supplier
- Catalogue Items
- Supplier Prices
- Delivery Information

Output

Draft Purchase Order

---

## Step 5 — Purchase Order Approval

Purchase Orders follow the configured approval workflow.

Possible outcomes

- Auto Approved
- Approved
- Rejected
- Returned for Amendment

---

## Step 6 — Purchase Order Issued

Approved Purchase Orders are sent to the Supplier.

Status

Sent to Supplier

---

## Step 7 — Future Procurement Stages

The following stages will be implemented in later phases.

- Goods Receipt
- Quality Inspection
- Warehouse Receipt
- Supplier Invoice
- Three-Way Matching
- Payment

---

# 6. Direct Purchase Process

In exceptional situations Procurement may create a Direct Purchase Order.

```

Need Identified
       │
       ▼
Direct Purchase Order
       │
       ▼
Approval
       │
       ▼
Supplier

```

A Direct Purchase Order

- does not require a Purchase Requisition
- requires a Direct Purchase Reason
- follows the standard approval workflow

---

# 7. Business Rules Applied

The following business rules are enforced during this process.

- Only Active Suppliers may be selected.
- Only Active Catalogue Items may be selected.
- Purchase Requisitions require approval.
- Standard Purchase Orders require an Approved Purchase Requisition.
- Direct Purchase Orders require a Direct Purchase Reason.
- Purchase Orders follow configurable approval thresholds.
- Approved Purchase Orders cannot be directly edited.
- Procurement activities are fully audited.

---

# 8. Future Process Expansion

The complete procurement lifecycle will be expanded to include:

Purchase Order

↓

Goods Receipt

↓

Quality Inspection

↓

Inventory Update

↓

Supplier Invoice

↓

Three-Way Matching

↓

Finance Approval

↓

Payment

↓

Purchase Order Closed

---
