# Entity Relationship Diagram (ERD)

## NEXORA Procurement Module

## 1. Purpose

This document defines the logical Entity Relationship Diagram for the NEXORA Procurement Management module.

The model supports:

- user authentication and role-based access
- supplier management
- raw material and item catalogue management
- supplier-item purchasing information
- purchase requisitions
- standard purchase orders
- direct purchase orders
- approval workflow
- status history
- notifications
- audit history

Goods receipt, supplier invoices, inventory and accounting integration will be added in later phases.

---

## 2. Core Entities

### Security

- User
- Role
- User Role

### Supplier Management

- Supplier
- Supplier Contact

### Item Catalogue

- Item Category
- Unit of Measure
- Catalogue Item
- Supplier Item

### Purchase Requisitions

- Purchase Requisition
- Purchase Requisition Item

### Purchase Orders

- Purchase Order
- Purchase Order Item

### Workflow and Traceability

- Approval
- Document Status History
- Notification
- Audit Log

---

## 3. Entity Relationship Diagram

```mermaid
erDiagram

    USER ||--o{ USER_ROLE : assigned
    ROLE ||--o{ USER_ROLE : contains

    USER ||--o{ PURCHASE_REQUISITION : creates
    USER ||--o{ PURCHASE_ORDER : creates
    USER ||--o{ APPROVAL : performs
    USER ||--o{ DOCUMENT_STATUS_HISTORY : changes
    USER ||--o{ AUDIT_LOG : performs
    USER ||--o{ NOTIFICATION : receives

    SUPPLIER ||--o{ SUPPLIER_CONTACT : has
    SUPPLIER ||--o{ SUPPLIER_ITEM : supplies
    SUPPLIER ||--o{ PURCHASE_ORDER : receives

    ITEM_CATEGORY ||--o{ CATALOGUE_ITEM : classifies

    UNIT_OF_MEASURE ||--o{ CATALOGUE_ITEM : purchase_unit
    UNIT_OF_MEASURE ||--o{ CATALOGUE_ITEM : stock_unit
    UNIT_OF_MEASURE ||--o{ SUPPLIER_ITEM : supplier_purchase_unit
    UNIT_OF_MEASURE ||--o{ PURCHASE_REQUISITION_ITEM : requested_unit
    UNIT_OF_MEASURE ||--o{ PURCHASE_ORDER_ITEM : ordered_unit

    CATALOGUE_ITEM ||--o{ SUPPLIER_ITEM : available_from
    CATALOGUE_ITEM ||--o{ PURCHASE_REQUISITION_ITEM : requested
    CATALOGUE_ITEM ||--o{ PURCHASE_ORDER_ITEM : ordered

    PURCHASE_REQUISITION ||--|{ PURCHASE_REQUISITION_ITEM : contains
    PURCHASE_REQUISITION ||--o{ PURCHASE_ORDER : converted_to
    PURCHASE_REQUISITION ||--o{ APPROVAL : requires
    PURCHASE_REQUISITION ||--o{ DOCUMENT_STATUS_HISTORY : has

    PURCHASE_ORDER ||--|{ PURCHASE_ORDER_ITEM : contains
    PURCHASE_ORDER ||--o{ APPROVAL : requires
    PURCHASE_ORDER ||--o{ DOCUMENT_STATUS_HISTORY : has

    SUPPLIER_ITEM ||--o{ PURCHASE_ORDER_ITEM : prices

    USER {
        bigint user_id PK
        string first_name
        string last_name
        string email UK
        string password_hash
        string status
        datetime created_at
        datetime updated_at
    }

    ROLE {
        bigint role_id PK
        string role_code UK
        string role_name
        string description
        boolean active
    }

    USER_ROLE {
        bigint user_role_id PK
        bigint user_id FK
        bigint role_id FK
        datetime assigned_at
        bigint assigned_by FK
    }

    SUPPLIER {
        bigint supplier_id PK
        string supplier_code UK
        string supplier_name
        string email
        string phone
        string address
        string payment_terms
        string status
        datetime created_at
        bigint created_by FK
        datetime updated_at
        bigint updated_by FK
    }

    SUPPLIER_CONTACT {
        bigint supplier_contact_id PK
        bigint supplier_id FK
        string contact_name
        string email
        string phone
        string job_title
        boolean primary_contact
        boolean active
    }

    ITEM_CATEGORY {
        bigint category_id PK
        string category_code UK
        string category_name
        boolean active
    }

    UNIT_OF_MEASURE {
        bigint uom_id PK
        string uom_code UK
        string uom_name
        boolean active
    }

    CATALOGUE_ITEM {
        bigint catalogue_item_id PK
        string item_code UK
        string item_name
        string item_type
        bigint category_id FK
        bigint purchase_uom_id FK
        bigint stock_uom_id FK
        decimal conversion_factor
        integer shelf_life_days
        string storage_condition
        boolean batch_tracking_required
        boolean expiry_tracking_required
        string allergen_information
        string country_of_origin
        string status
        datetime created_at
        bigint created_by FK
        datetime updated_at
        bigint updated_by FK
    }

    SUPPLIER_ITEM {
        bigint supplier_item_id PK
        bigint supplier_id FK
        bigint catalogue_item_id FK
        string supplier_item_code
        bigint purchase_uom_id FK
        decimal unit_price
        decimal minimum_order_quantity
        integer lead_time_days
        boolean preferred_supplier
        date effective_from
        date effective_to
        boolean active
    }

    PURCHASE_REQUISITION {
        bigint requisition_id PK
        string requisition_number UK
        bigint requested_by FK
        string department
        date required_date
        string justification
        string status
        decimal estimated_total
        datetime created_at
        datetime submitted_at
        datetime updated_at
    }

    PURCHASE_REQUISITION_ITEM {
        bigint requisition_item_id PK
        bigint requisition_id FK
        bigint catalogue_item_id FK
        string description
        decimal quantity
        bigint requested_uom_id FK
        decimal estimated_unit_price
        decimal estimated_line_total
        date required_date
    }

    PURCHASE_ORDER {
        bigint purchase_order_id PK
        string po_number UK
        string order_type
        bigint source_requisition_id FK
        bigint supplier_id FK
        bigint supplier_contact_id FK
        bigint created_by FK
        date order_date
        date required_delivery_date
        string delivery_address
        string currency_code
        decimal subtotal
        decimal tax_amount
        decimal total_amount
        string status
        integer revision_number
        string direct_purchase_reason
        datetime created_at
        datetime submitted_at
        datetime approved_at
        datetime sent_at
        datetime updated_at
    }

    PURCHASE_ORDER_ITEM {
        bigint purchase_order_item_id PK
        bigint purchase_order_id FK
        bigint catalogue_item_id FK
        bigint supplier_item_id FK
        string description
        decimal quantity
        bigint ordered_uom_id FK
        decimal unit_price
        decimal line_total
    }

    APPROVAL {
        bigint approval_id PK
        string document_type
        bigint document_id
        bigint approver_id FK
        string decision
        string comments
        decimal approval_threshold
        datetime assigned_at
        datetime decided_at
    }

    DOCUMENT_STATUS_HISTORY {
        bigint status_history_id PK
        string document_type
        bigint document_id
        string previous_status
        string new_status
        string action
        string comments
        bigint changed_by FK
        datetime changed_at
    }

    NOTIFICATION {
        bigint notification_id PK
        bigint recipient_user_id FK
        string document_type
        bigint document_id
        string notification_type
        string message
        string status
        datetime created_at
        datetime sent_at
    }

    AUDIT_LOG {
        bigint audit_log_id PK
        bigint user_id FK
        string entity_type
        bigint entity_id
        string action
        string previous_values
        string new_values
        datetime created_at
    }
```

---

## 4. Key Design Decisions

### User and Role Relationship

A user may have more than one role.

The `USER_ROLE` entity supports a many-to-many relationship between users and roles.

---

### Standard and Direct Purchase Orders

Both Standard Purchase Orders and Direct Purchase Orders use the same `PURCHASE_ORDER` entity.

The `order_type` field identifies whether the order is:

- `STANDARD`
- `DIRECT`

For a Standard Purchase Order:

- `source_requisition_id` is required
- `direct_purchase_reason` is not required

For a Direct Purchase Order:

- `source_requisition_id` is null
- `direct_purchase_reason` is required

---

### Purchase Order Revisions

Approved Purchase Orders are not overwritten.

The `revision_number` field supports controlled amendments while audit and status-history records preserve the previous activity.

A more advanced revision table may be introduced later if full document version snapshots are required.

---

### Supplier-Item Catalogue

The `SUPPLIER_ITEM` entity maintains supplier-specific information such as:

- supplier item code
- unit price
- purchase unit
- minimum order quantity
- lead time
- preferred-supplier status
- price-effective dates

---

### Workflow Records

The `APPROVAL` entity records approval decisions.

The `DOCUMENT_STATUS_HISTORY` entity records every document status transition.

The `AUDIT_LOG` entity records broader changes to business records.

These entities have different responsibilities and should not be merged.

---

## 5. Phase 1 Exclusions

The following entities will be introduced in later phases:

- Warehouse
- Storage Location
- Inventory Balance
- Goods Receipt
- Goods Receipt Item
- Batch or Lot
- Quality Inspection
- Quarantine
- Supplier Invoice
- Supplier Invoice Item
- Three-Way Match
- Accounting Export
- Payment
- General Ledger Posting
