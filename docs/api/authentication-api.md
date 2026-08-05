# Authentication API Specification

## 1. Purpose

This document defines the REST API contract for authentication and user-session management in NEXORA.

The Authentication API supports:

- User login
- User logout
- Access-token refresh
- Current-user profile retrieval
- Role and permission retrieval
- Account-status validation

All endpoints use JSON unless otherwise stated.

---

# 2. Base Path

```text
/api/v1/auth
```

---

# 3. Authentication Method

NEXORA will use token-based authentication.

The initial implementation will use:

- Short-lived JWT access token
- Longer-lived refresh token
- Role-based access control
- Secure password hashing

Protected API requests must include:

```http
Authorization: Bearer <access_token>
```

Passwords, access tokens and refresh tokens must never be written to application logs.

---

# 4. User Login

## Endpoint

```http
POST /api/v1/auth/login
```

## Access

Public

## Purpose

Authenticates an active registered user and returns access and refresh tokens.

## Request Body

```json
{
  "email": "procurement.officer@nexora.com",
  "password": "SecurePassword123!"
}
```

## Request Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `email` | string | Yes | Registered user email address |
| `password` | string | Yes | User password |

## Validation

- Email must use a valid format.
- Email shall be normalised to lowercase.
- Password must not be empty.
- User account must exist.
- User status must be `ACTIVE`.
- Password must match the stored password hash.

## Success Response

### Status

```http
200 OK
```

### Body

```json
{
  "access_token": "jwt-access-token",
  "refresh_token": "jwt-refresh-token",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "user_id": 1001,
    "first_name": "Alex",
    "last_name": "Morgan",
    "email": "procurement.officer@nexora.com",
    "status": "ACTIVE",
    "roles": [
      {
        "role_code": "PROCUREMENT_OFFICER",
        "role_name": "Procurement Officer"
      }
    ]
  }
}
```

## Error Responses

### Invalid Credentials

```http
401 Unauthorized
```

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "The email address or password is incorrect."
  }
}
```

### Inactive Account

```http
403 Forbidden
```

```json
{
  "error": {
    "code": "AUTH_ACCOUNT_INACTIVE",
    "message": "This user account is inactive."
  }
}
```

### Locked Account

```http
423 Locked
```

```json
{
  "error": {
    "code": "AUTH_ACCOUNT_LOCKED",
    "message": "This user account is locked."
  }
}
```

### Validation Failure

```http
422 Unprocessable Entity
```

---

# 5. Refresh Access Token

## Endpoint

```http
POST /api/v1/auth/refresh
```

## Access

Refresh token required

## Purpose

Issues a new access token without requiring the user to log in again.

## Request Body

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

## Success Response

```http
200 OK
```

```json
{
  "access_token": "new-jwt-access-token",
  "refresh_token": "rotated-refresh-token",
  "token_type": "bearer",
  "expires_in": 900
}
```

## Validation

- Refresh token must be valid.
- Refresh token must not be expired or revoked.
- Associated user must remain active.
- Refresh-token rotation should be supported.

## Error Response

```http
401 Unauthorized
```

```json
{
  "error": {
    "code": "AUTH_INVALID_REFRESH_TOKEN",
    "message": "The refresh token is invalid or expired."
  }
}
```

---

# 6. Logout

## Endpoint

```http
POST /api/v1/auth/logout
```

## Access

Authenticated user

## Purpose

Ends the current authenticated session and revokes the associated refresh token.

## Request Body

```json
{
  "refresh_token": "jwt-refresh-token"
}
```

## Success Response

```http
204 No Content
```

## Behaviour

- The refresh token must be revoked.
- The current access token may remain valid until expiry unless token denylisting is implemented.
- The logout event must be recorded in the audit log.

---

# 7. Get Current User

## Endpoint

```http
GET /api/v1/auth/me
```

## Access

Authenticated user

## Purpose

Returns the current user's account information, roles and permissions.

## Success Response

```http
200 OK
```

```json
{
  "user_id": 1001,
  "first_name": "Alex",
  "last_name": "Morgan",
  "email": "procurement.officer@nexora.com",
  "status": "ACTIVE",
  "last_login_at": "2026-08-05T14:30:00+10:00",
  "roles": [
    {
      "role_code": "PROCUREMENT_OFFICER",
      "role_name": "Procurement Officer"
    }
  ],
  "permissions": [
    "supplier:create",
    "supplier:view",
    "supplier:update",
    "requisition:view",
    "purchase_order:create",
    "purchase_order:update",
    "purchase_order:submit"
  ]
}
```

## Error Response

```http
401 Unauthorized
```

---

# 8. Get Current User Permissions

## Endpoint

```http
GET /api/v1/auth/permissions
```

## Access

Authenticated user

## Purpose

Returns the permissions available to the current user.

## Success Response

```http
200 OK
```

```json
{
  "roles": [
    "PROCUREMENT_OFFICER"
  ],
  "permissions": [
    "supplier:create",
    "supplier:view",
    "supplier:update",
    "catalogue_item:view",
    "purchase_order:create",
    "purchase_order:update",
    "purchase_order:submit"
  ]
}
```

---

# 9. Authorization Rules

Initial NEXORA roles include:

| Role Code | Description |
|---|---|
| `REQUESTER` | Creates and submits Purchase Requisitions |
| `PROCUREMENT_OFFICER` | Manages suppliers and Purchase Orders |
| `NOMINATED_APPROVER` | Approves or rejects procurement documents |
| `PROCUREMENT_MANAGER` | Manages procurement rules and reporting |
| `SYSTEM_ADMINISTRATOR` | Manages users, roles and configuration |

A user may have more than one role.

The API must check permissions for every protected operation. Hiding a button in the user interface is not sufficient security.

---

# 10. Security Requirements

- Passwords must be securely hashed using Argon2id or bcrypt.
- Login responses must not expose password hashes.
- Login failure messages must not confirm whether an email address exists.
- Access tokens should have a short expiry period.
- Refresh tokens must be stored and transmitted securely.
- Production authentication traffic must use HTTPS.
- Login attempts should be rate-limited.
- Repeated failed login attempts may temporarily lock the account.
- Authentication events must be auditable.
- Sensitive tokens must not be stored in plain text where avoidable.

---

# 11. Audit Events

The following events should be recorded:

```text
LOGIN_SUCCESS
LOGIN_FAILED
LOGOUT
TOKEN_REFRESH
ACCOUNT_LOCKED
ROLE_ASSIGNMENT
ROLE_REMOVAL
```

Each event should include:

- User ID where available
- Action
- Date and time
- Request ID
- IP address where appropriate
- Success or failure result

---

# 12. Standard Error Format

All API errors should use a consistent structure:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "The email address or password is incorrect.",
    "details": [],
    "request_id": "2f32eaa3-60df-4a42-b224-b072f851ef70"
  }
}
```

Technical stack traces must not be returned to the client.
