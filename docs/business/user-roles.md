# User Roles

## Overview

The NEXORA Procurement Management module uses role-based access control (RBAC) to ensure procurement activities are performed securely and only by authorised users.

Each user is assigned one or more roles, with permissions that define the actions they can perform.

---

# 1. Requesting Employee

## Description

A Requesting Employee identifies business needs and creates Purchase Requisitions for approval.

## Responsibilities

- Create Purchase Requisitions
- Edit Draft Requisitions
- Submit Requisitions
- View Own Requisitions

## Permissions

✅ Create Purchase Requisitions

✅ Edit Draft Purchase Requisitions

✅ Submit Purchase Requisitions

✅ View Own Purchase Requisitions

❌ Approve Requisitions

❌ Approve Purchase Orders

❌ Manage Suppliers

❌ Manage Users

---

# 2. Procurement Officer

## Description

The Procurement Officer manages suppliers and creates Purchase Orders from approved Purchase Requisitions or creates authorised Direct Purchase Orders.

## Responsibilities

- Manage Suppliers
- Manage Supplier Contacts
- Maintain Supplier Item Catalogue
- Create Purchase Orders
- Create Direct Purchase Orders
- Edit Draft Purchase Orders
- Submit Purchase Orders
- View Procurement History

## Permissions

✅ Manage Suppliers

✅ Create Purchase Orders

✅ Create Direct Purchase Orders

✅ Edit Draft Purchase Orders

✅ Submit Purchase Orders

✅ View Purchase Orders

❌ Approve Purchase Orders

❌ Manage Users

---

# 3. Nominated Approver

## Description

The Nominated Approver reviews Purchase Requisitions and Purchase Orders according to the configured approval workflow.

## Responsibilities

- Review submitted documents
- Approve documents
- Reject documents
- Return documents for amendment
- Add approval comments

## Permissions

✅ View Submitted Documents

✅ Approve Documents

✅ Reject Documents

✅ Return for Amendment

❌ Create Purchase Orders

❌ Manage Suppliers

❌ Manage Users

---

# 4. Procurement Manager

## Description

The Procurement Manager oversees procurement operations and approval configuration.

## Responsibilities

- Monitor procurement activities
- Configure approval rules
- Review procurement performance
- Manage procurement policies

## Permissions

✅ View All Procurement Records

✅ Configure Approval Rules

✅ View Reports

❌ Manage Users

---

# 5. System Administrator

## Description

The System Administrator manages users, security and system configuration.

## Responsibilities

- Create Users
- Edit Users
- Assign Roles
- Activate or Deactivate Users
- Configure System Settings

## Permissions

✅ Create Users

✅ Edit Users

✅ Assign Roles

✅ Configure System Settings

---

# Role Access Matrix

| Feature | Requester | Procurement Officer | Approver | Procurement Manager | Administrator |
|----------|-----------|---------------------|-----------|---------------------|---------------|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Purchase Requisition | ✅ | ❌ | ❌ | ❌ | ✅ |
| Submit Purchase Requisition | ✅ | ❌ | ❌ | ❌ | ✅ |
| Manage Suppliers | ❌ | ✅ | ❌ | ✅ | ✅ |
| Create Purchase Order | ❌ | ✅ | ❌ | ❌ | ✅ |
| Create Direct Purchase Order | ❌ | ✅ | ❌ | ❌ | ✅ |
| Submit Purchase Order | ❌ | ✅ | ❌ | ❌ | ✅ |
| Approve Documents | ❌ | ❌ | ✅ | ❌ | ✅ |
| Reject Documents | ❌ | ❌ | ✅ | ❌ | ✅ |
| Return for Amendment | ❌ | ❌ | ✅ | ❌ | ✅ |
| Configure Approval Rules | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |

---

# Future Roles

Future phases of NEXORA will introduce additional roles, including:

- Warehouse Officer
- Inventory Manager
- Quality Officer
- Production Planner
- Manufacturing Operator
- Accounts Payable Officer
- Finance Manager
- Sales Representative
- Executive Manager
- Auditor
