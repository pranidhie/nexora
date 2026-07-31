# Entity Relationship Diagram (ERD)

## Procurement Module

The Procurement module consists of the following entities:

- User
- Role
- Supplier
- Purchase Order
- Purchase Order Item

## ER Diagram

```mermaid
erDiagram

    ROLE ||--o{ USER : has

    USER ||--o{ PURCHASE_ORDER : creates

    SUPPLIER ||--o{ PURCHASE_ORDER : supplies

    PURCHASE_ORDER ||--|{ PURCHASE_ORDER_ITEM : contains

    ROLE {
        int role_id PK
        string role_name
    }

    USER {
        int user_id PK
        string first_name
        string last_name
        string email
        string password
        int role_id FK
    }

    SUPPLIER {
        int supplier_id PK
        string supplier_name
        string email
        string phone
        string address
        boolean active
    }

    PURCHASE_ORDER {
        int po_id PK
        date order_date
        string status
        decimal total_amount
        int supplier_id FK
        int created_by FK
    }

    PURCHASE_ORDER_ITEM {
        int item_id PK
        string item_name
        int quantity
        decimal unit_price
        decimal total_price
        int po_id FK
    }
```
