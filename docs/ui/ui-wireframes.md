# UI Wireframes

## Overview

This document defines the initial user interface layout for the NexusERP Procurement module.

The first version will include:

- Login page
- Dashboard
- Supplier list
- Supplier form
- Purchase order list
- Purchase order form
- Purchase order approval page

---

## Login Page

```text
+--------------------------------------------------+
|                   NexusERP                       |
|                                                  |
| Email                                            |
| [____________________________________________]   |
|                                                  |
| Password                                         |
| [____________________________________________]   |
|                                                  |
|                 [ Sign In ]                      |
|                                                  |
+--------------------------------------------------+
```

---

## Main Layout

```text
+--------------------------------------------------------------+
| NexusERP                           User Name | Logout         |
+------------------+-------------------------------------------+
| Dashboard        |                                           |
| Suppliers        |              Main Content                 |
| Purchase Orders  |                                           |
| Approvals        |                                           |
| Reports          |                                           |
| Administration   |                                           |
+------------------+-------------------------------------------+
```

---

## Dashboard

```text
+--------------------------------------------------------------+
| Dashboard                                                    |
+--------------------------------------------------------------+
| Total Suppliers | Draft POs | Pending Approval | Approved    |
|       25        |     4     |        7         |     18      |
+--------------------------------------------------------------+
| Recent Purchase Orders                                       |
|--------------------------------------------------------------|
| PO Number | Supplier | Amount | Status | Created Date        |
| PO-0001   | ABC Ltd  | 500.00 | Draft  | 31-Jul-2026         |
+--------------------------------------------------------------+
```

---

## Supplier List

```text
+--------------------------------------------------------------+
| Suppliers                              [ Add Supplier ]       |
+--------------------------------------------------------------+
| Search: [________________________]   Status: [Active v]       |
+--------------------------------------------------------------+
| Code    | Supplier Name | Email | Phone | Status | Actions   |
| SUP-001 | ABC Supplies  | ...   | ...   | Active | Edit      |
+--------------------------------------------------------------+
```

---

## Supplier Form

```text
+--------------------------------------------------------------+
| Add Supplier                                                 |
+--------------------------------------------------------------+
| Supplier Code                                                |
| [________________________________________________________]   |
|                                                              |
| Supplier Name                                                |
| [________________________________________________________]   |
|                                                              |
| Email                                                        |
| [________________________________________________________]   |
|                                                              |
| Phone                                                        |
| [________________________________________________________]   |
|                                                              |
| Address                                                      |
| [________________________________________________________]   |
|                                                              |
| Active [x]                                                   |
|                                                              |
| [ Cancel ]                                  [ Save Supplier ] |
+--------------------------------------------------------------+
```

---

## Purchase Order List

```text
+--------------------------------------------------------------+
| Purchase Orders                     [ Create Purchase Order ] |
+--------------------------------------------------------------+
| Search: [____________] Status: [All v] Supplier: [All v]     |
+--------------------------------------------------------------+
| PO No. | Supplier | Date | Total | Status | Created By       |
| PO-001 | ABC Ltd  | ...  | 500   | Draft  | Procurement User |
+--------------------------------------------------------------+
```

---

## Purchase Order Form

```text
+--------------------------------------------------------------+
| Create Purchase Order                                        |
+--------------------------------------------------------------+
| Supplier                                                     |
| [ Select Supplier                                      v ]   |
|                                                              |
| Order Date                                                   |
| [ 31-Jul-2026 ]                                              |
+--------------------------------------------------------------+
| Items                                                        |
|--------------------------------------------------------------|
| Item Name | Quantity | Unit Price | Total | Remove            |
| [_______] | [______] | [________] | 0.00  | [X]               |
|                                                              |
| [ Add Item ]                                                 |
+--------------------------------------------------------------+
| Total Amount:                                      0.00      |
|                                                              |
| [ Cancel ]             [ Save Draft ]       [ Submit ]        |
+--------------------------------------------------------------+
```

---

## Purchase Order Approval Page

```text
+--------------------------------------------------------------+
| Purchase Order Approval                                      |
+--------------------------------------------------------------+
| PO Number: PO-001                                            |
| Supplier: ABC Supplies                                       |
| Created By: Procurement Officer                              |
| Total Amount: 500.00                                         |
| Status: Submitted                                            |
+--------------------------------------------------------------+
| Purchase Order Items                                         |
|--------------------------------------------------------------|
| Item | Quantity | Unit Price | Total                          |
+--------------------------------------------------------------+
| Rejection Reason                                             |
| [________________________________________________________]   |
|                                                              |
| [ Reject ]                                    [ Approve ]    |
+--------------------------------------------------------------+
```

---

## Design Principles

The NexusERP user interface should be:

- Simple
- Responsive
- Accessible
- Consistent
- Easy to navigate
- Suitable for enterprise users
- Clear when displaying errors and success messages

---

## Future Screens

- Goods Receipt
- Inventory
- Supplier Performance
- Reports
- User Management
- Audit Logs
- AI Quality Dashboard
- Automated Test Results
