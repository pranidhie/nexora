# NEXORA Backend Architecture

## 1. Purpose

This document defines the backend architecture for the NEXORA Procurement Management module.

The backend will be developed using FastAPI and PostgreSQL. It will expose REST APIs for authentication, suppliers, catalogue items, purchase requisitions, purchase orders, approvals, notifications and audit history.

The architecture is designed to support:

- modular development
- clear separation of responsibilities
- automated testing
- secure authentication and authorisation
- database transaction integrity
- future ERP module expansion
- future AI integration

---

# 2. Technology Stack

| Area | Technology |
|---|---|
| Backend Framework | FastAPI |
| Programming Language | Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Data Validation | Pydantic |
| Database Migrations | Alembic |
| Authentication | JWT access and refresh tokens |
| Password Hashing | Argon2id |
| API Documentation | OpenAPI and Swagger UI |
| Testing | Pytest |
| HTTP Testing | FastAPI TestClient or HTTPX |
| Configuration | Environment variables |
| Dependency Management | `requirements.txt` initially |
| Containerisation | Docker in a later step |

---

# 3. High-Level Architecture

```text
React Frontend
      ↓
FastAPI REST API
      ↓
Authentication and RBAC
      ↓
API Routers
      ↓
Application Services
      ↓
Repositories
      ↓
SQLAlchemy Models
      ↓
PostgreSQL
```

Cross-cutting services include:

```text
Validation
Audit Logging
Notifications
Error Handling
Request Tracing
Configuration
Security
```

Future AI services will integrate through separate application services rather than directly accessing database tables from the frontend.

---

# 4. Backend Project Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── dependencies/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── suppliers.py
│   │       ├── catalogue.py
│   │       ├── requisitions.py
│   │       ├── purchase_orders.py
│   │       ├── approvals.py
│   │       └── notifications.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── permissions.py
│   │   ├── exceptions.py
│   │   └── logging.py
│   │
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── migrations/
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── supplier.py
│   │   ├── catalogue.py
│   │   ├── requisition.py
│   │   ├── purchase_order.py
│   │   ├── approval.py
│   │   ├── notification.py
│   │   └── audit.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── supplier.py
│   │   ├── catalogue.py
│   │   ├── requisition.py
│   │   ├── purchase_order.py
│   │   ├── approval.py
│   │   ├── notification.py
│   │   └── common.py
│   │
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── supplier_repository.py
│   │   ├── catalogue_repository.py
│   │   ├── requisition_repository.py
│   │   ├── purchase_order_repository.py
│   │   ├── approval_repository.py
│   │   └── notification_repository.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── supplier_service.py
│   │   ├── catalogue_service.py
│   │   ├── requisition_service.py
│   │   ├── purchase_order_service.py
│   │   ├── approval_service.py
│   │   ├── notification_service.py
│   │   └── audit_service.py
│   │
│   ├── middleware/
│   │   ├── request_id.py
│   │   ├── error_handler.py
│   │   └── audit_context.py
│   │
│   ├── utils/
│   │   ├── dates.py
│   │   ├── pagination.py
│   │   └── identifiers.py
│   │
│   └── main.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── api/
│   └── conftest.py
│
├── alembic/
├── alembic.ini
├── requirements.txt
├── .env.example
├── Dockerfile
└── README.md
```

---

# 5. Architectural Layers

## 5.1 API Layer

The API layer contains FastAPI routers.

Responsibilities:

- receive HTTP requests
- validate request payloads
- enforce authentication
- call application services
- return HTTP responses
- map domain errors to API errors

The API layer must not contain complex business logic.

Example:

```text
POST /api/v1/purchase-orders/{id}/submit
        ↓
purchase_orders router
        ↓
purchase_order_service.submit_purchase_order()
```

---

## 5.2 Schema Layer

Pydantic schemas define:

- request bodies
- response bodies
- query parameters
- validation rules
- API serialization

Separate schemas should be used for:

- creation
- updates
- responses
- list results
- workflow actions

Examples:

```text
SupplierCreate
SupplierUpdate
SupplierResponse

PurchaseOrderCreate
PurchaseOrderUpdate
PurchaseOrderSubmit
PurchaseOrderResponse
```

Pydantic schemas must not be used as database models.

---

## 5.3 Service Layer

The service layer contains business logic.

Responsibilities include:

- supplier validation
- status-transition enforcement
- purchase-order calculations
- approval-rule evaluation
- self-approval prevention
- workflow orchestration
- notification generation
- audit-log generation
- transaction coordination

Examples:

```text
requisition_service.submit_requisition()
purchase_order_service.create_standard_po()
purchase_order_service.submit_purchase_order()
approval_service.evaluate_rule()
```

The service layer is the authoritative location for business workflow logic.

---

## 5.4 Repository Layer

Repositories handle database access.

Responsibilities include:

- retrieving records
- creating records
- updating records
- query filtering
- pagination
- row locking
- database-specific operations

Repositories must not decide business workflow outcomes.

Example:

```text
purchase_order_repository.get_by_id()
purchase_order_repository.lock_for_update()
purchase_order_repository.save()
```

---

## 5.5 Model Layer

SQLAlchemy models map Python classes to PostgreSQL tables.

The models should reflect the approved schema:

- users
- roles
- user_roles
- suppliers
- supplier_contacts
- item_categories
- units_of_measure
- catalogue_items
- supplier_items
- purchase_requisitions
- purchase_requisition_items
- purchase_orders
- purchase_order_items
- approval_rules
- purchase_requisition_approvals
- purchase_order_approvals
- purchase_requisition_status_history
- purchase_order_status_history
- notifications
- audit_logs

Models should define:

- columns
- foreign keys
- relationships
- indexes
- database constraints

Complex business logic should not be embedded in ORM models.

---

# 6. Database Session Management

The application shall use SQLAlchemy sessions through FastAPI dependencies.

Example flow:

```text
Request
  ↓
Database Session Dependency
  ↓
Service and Repository Operations
  ↓
Commit or Rollback
  ↓
Session Closed
```

Each request should use one database session.

Multi-step business operations must be committed in a single transaction.

Examples:

- submit requisition
- approve requisition
- create Standard PO from requisition
- submit PO
- approve PO
- cancel PO

If any step fails, the entire operation must be rolled back.

---

# 7. Authentication Architecture

The authentication service shall support:

- email and password login
- password verification
- JWT access tokens
- refresh tokens
- logout and refresh-token revocation
- account-status checks
- user-role retrieval

The access token should include only necessary claims:

```json
{
  "sub": "1001",
  "type": "access",
  "roles": [
    "PROCUREMENT_OFFICER"
  ],
  "exp": 1785900000
}
```

The system must not store plain-text passwords.

Passwords should be hashed using Argon2id.

---

# 8. Role-Based Access Control

Authorization must be enforced at the API and service layers.

Example permissions:

```text
supplier:create
supplier:update
catalogue_item:create
requisition:create
requisition:approve
purchase_order:create
purchase_order:submit
purchase_order:approve
approval_rule:manage
```

A role may map to multiple permissions.

A user may hold multiple roles.

Frontend visibility is not a security control. The backend must reject unauthorised operations.

---

# 9. Workflow Architecture

Purchase Requisition and Purchase Order workflows must use explicit service methods.

Example Purchase Order submission:

```text
Load PO with lock
        ↓
Validate editable status
        ↓
Validate supplier and items
        ↓
Recalculate totals
        ↓
Evaluate approval rule
        ↓
Create approval record
        ↓
Update PO status
        ↓
Create status-history record
        ↓
Create notification
        ↓
Create audit log
        ↓
Commit transaction
```

Workflow updates must be atomic.

---

# 10. Approval Architecture

NEXORA uses separate approval tables:

```text
purchase_requisition_approvals
purchase_order_approvals
```

This provides enforceable PostgreSQL foreign keys.

The approval service shall:

- evaluate effective approval rules
- identify auto-approval or manual approval
- resolve eligible approvers
- prevent self-approval
- create pending approval tasks
- record decisions
- prevent duplicate decisions
- use row locking for concurrent approval protection

A generic workflow engine may be introduced in a later phase.

---

# 11. Status Management

Valid status transitions must be controlled by application services.

Example configuration:

```python
PURCHASE_ORDER_TRANSITIONS = {
    "DRAFT": {"SUBMITTED", "APPROVED", "PENDING_APPROVAL", "CANCELLED"},
    "PENDING_APPROVAL": {
        "APPROVED",
        "REJECTED",
        "RETURNED_FOR_AMENDMENT",
        "CANCELLED",
    },
    "RETURNED_FOR_AMENDMENT": {
        "SUBMITTED",
        "APPROVED",
        "PENDING_APPROVAL",
        "CANCELLED",
    },
    "APPROVED": {"SENT_TO_SUPPLIER", "ON_HOLD", "CANCELLED"},
    "ON_HOLD": {"APPROVED", "SENT_TO_SUPPLIER", "CANCELLED"},
}
```

The database stores current status and status history, while the service layer controls permitted transitions.

---

# 12. Audit Architecture

Significant actions must create immutable audit records.

Audit entries may include:

- entity type
- entity ID
- action
- previous values
- new values
- reason
- user ID
- request ID
- IP address
- timestamp

Sensitive values must be removed before audit storage.

Examples that must never appear in audit JSON:

- passwords
- password hashes
- access tokens
- refresh tokens
- secrets

---

# 13. Notification Architecture

Phase 1 will use in-application notifications.

Notification creation will be triggered by workflow services.

Examples:

- requisition submitted
- requisition approved
- PO approval required
- PO returned
- PO approved
- PO sent

Initially, notifications may be created directly in the same database transaction.

A transactional-outbox pattern may be added when asynchronous email or external messaging is introduced.

---

# 14. Error Handling

The application must use a standard API error format:

```json
{
  "error": {
    "code": "PURCHASE_ORDER_NOT_EDITABLE",
    "message": "Only Draft or Returned for Amendment Purchase Orders can be edited.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Domain exceptions should be mapped to appropriate HTTP status codes.

Examples:

| Domain Error | HTTP Status |
|---|---:|
| Not found | `404` |
| Invalid credentials | `401` |
| Permission denied | `403` |
| Invalid status transition | `409` |
| Duplicate business code | `409` |
| Validation error | `422` |
| Locked account | `423` |

Stack traces must not be returned to clients.

---

# 15. Request Tracing

Every API request should receive a unique request ID.

The request ID should be:

- returned in response headers
- included in structured logs
- included in API error responses
- included in audit records where appropriate

Example header:

```http
X-Request-ID: 2f32eaa3-60df-4a42-b224-b072f851ef70
```

---

# 16. Configuration Management

Configuration shall be loaded from environment variables.

Example `.env.example`:

```text
APP_NAME=NEXORA
APP_ENV=development
DEBUG=true

DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/nexora

JWT_SECRET_KEY=replace-with-secure-value
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:5173
```

Secrets must not be committed to GitHub.

---

# 17. API Versioning

Initial APIs will use:

```text
/api/v1
```

Breaking changes should be introduced through a new version rather than silently changing existing contracts.

Example:

```text
/api/v1/purchase-orders
/api/v2/purchase-orders
```

---

# 18. Testing Architecture

The backend must support:

## Unit Tests

Test individual service and utility functions.

Examples:

- PO total calculation
- approval threshold selection
- status transition validation
- self-approval prevention

## Integration Tests

Test the service and database together.

Examples:

- supplier creation
- requisition submission
- PO conversion
- approval decisions

## API Tests

Test endpoints, authorization and response contracts.

Examples:

- login success and failure
- unauthorised supplier creation
- submit invalid PO
- duplicate approval attempt

## Database Tests

Test:

- foreign keys
- unique constraints
- check constraints
- transaction rollback
- concurrency controls

---

# 19. Future AI Integration

Future AI services may include:

- RAG over requirements and workflow documentation
- AI-assisted test-case generation
- AI defect analysis
- procurement-risk explanations
- supplier and PO summarisation
- LangGraph workflow orchestration
- ChromaDB retrieval
- MCP-based external integrations

AI services must access procurement functionality through approved services and APIs.

Core procurement workflows must continue operating if AI services are unavailable.

---

# 20. Backend Implementation Order

The recommended implementation sequence is:

1. Project setup and configuration
2. Database connection
3. SQLAlchemy base models
4. User and role models
5. Authentication and JWT
6. RBAC dependencies
7. Supplier module
8. Catalogue module
9. Requisition module
10. Purchase Order module
11. Approval workflow
12. Notifications
13. Audit logging
14. Automated tests
15. Docker configuration
16. Future AI services

---

# 21. Architectural Principles

The NEXORA backend shall follow these principles:

- Business logic belongs in services.
- Database queries belong in repositories.
- API routers remain thin.
- Transactions protect workflow consistency.
- Authorization is enforced server-side.
- Audit history is append-only.
- Historical records are preserved.
- External services must not break core procurement.
- Modules should be independently maintainable.
- Interfaces should support future ERP expansion.
