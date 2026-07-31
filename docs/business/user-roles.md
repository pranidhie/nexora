# User Roles

## Overview

The Procurement Management module supports multiple user roles. Each role has different responsibilities and system permissions to ensure secure and efficient procurement operations.

---

# 1. Procurement Officer

## Description

A Procurement Officer is responsible for creating and managing suppliers and purchase orders before they are submitted for approval.

## Responsibilities

- Create suppliers
- Update supplier information
- Create purchase orders
- Add purchase order items
- Edit draft purchase orders
- Submit purchase orders
- View purchase order history

## Permissions

✅ Create Purchase Orders

✅ Edit Draft Purchase Orders

✅ Submit Purchase Orders

✅ View Purchase Orders

❌ Approve Purchase Orders

❌ Reject Purchase Orders

❌ Manage Users

---

# 2. Procurement Manager

## Description

A Procurement Manager reviews submitted purchase orders and decides whether they should be approved or rejected.

## Responsibilities

- Review submitted purchase orders
- Approve purchase orders
- Reject purchase orders
- Provide rejection reasons
- Monitor procurement activities

## Permissions

✅ View Purchase Orders

✅ Approve Purchase Orders

✅ Reject Purchase Orders

❌ Create Suppliers

❌ Manage Users

---

# 3. System Administrator

## Description

The System Administrator manages users, roles, and overall system configuration.

## Responsibilities

- Create users
- Update users
- Assign roles
- Activate and deactivate users
- Manage system configuration

## Permissions

✅ Create Users

✅ Edit Users

✅ Assign Roles

✅ Manage System Configuration

---

# Role Access Matrix

| Feature | Procurement Officer | Procurement Manager | Administrator |
|----------|--------------------|--------------------|---------------|
| Login | ✅ | ✅ | ✅ |
| Create Supplier | ✅ | ❌ | ✅ |
| Edit Supplier | ✅ | ❌ | ✅ |
| Create Purchase Order | ✅ | ❌ | ✅ |
| Edit Draft Purchase Order | ✅ | ❌ | ✅ |
| Submit Purchase Order | ✅ | ❌ | ✅ |
| Approve Purchase Order | ❌ | ✅ | ✅ |
| Reject Purchase Order | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## Future Roles

As NexusERP grows, additional roles may include:

- Warehouse Operator
- Inventory Manager
- Finance Officer
- Sales Representative
- Auditor
- Executive Manager
  
