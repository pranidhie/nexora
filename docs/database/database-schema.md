# NEXORA Procurement Database Schema

## 1. Purpose

This document defines the PostgreSQL database schema for the NEXORA Procurement Management module.

The schema is based on the approved business processes, user stories, business rules, functional requirements and ERD.

---

# 2. Security Schema

## 2.1 users

### Purpose

Stores registered NEXORA users and authentication-related account information.

| Column | Data Type | Required | Key | Default | Description |
|---|---|---:|---|---|---|
| user_id | bigint | Yes | PK | Identity | Unique user identifier |
| first_name | varchar(100) | Yes |  |  | User's first name |
| last_name | varchar(100) | Yes |  |  | User's last name |
| email | varchar(255) | Yes | UK |  | Unique login email |
| password_hash | varchar(255) | Yes |  |  | Securely hashed password |
| status | varchar(20) | Yes |  | ACTIVE | User account status |
| created_at | timestamptz | Yes |  | current_timestamp | Creation timestamp |
| updated_at | timestamptz | Yes |  | current_timestamp | Last update timestamp |

### Constraints

- Email must be unique.
- Status must be one of `ACTIVE`, `INACTIVE`, or `LOCKED`.
- Passwords must never be stored in plain text.

### Indexes

- Unique index on `email`
- Index on `status`
