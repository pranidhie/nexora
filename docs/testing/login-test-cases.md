# NEXORA Login and Authentication Test Cases

## Document Information

| Field           | Details                                        |
| --------------- | ---------------------------------------------- |
| Project         | NEXORA                                         |
| Module          | Authentication and Login                       |
| Test Type       | Functional, Security and Authorization Testing |
| Status          | In Progress                                    |
| Created By      | Pranidhi Peiris                                |
| Automation Tool | Playwright with TypeScript                     |

## Scope

This document defines the test coverage for the NEXORA login and authentication functionality.

NEXORA is designed to support multiple user roles. However, the initial automation implementation will use the currently available test account. Role-based test cases will be automated after the required test users and permissions are implemented.

---

## Login Test Cases

### LOGIN-001 — Successful Login

| Field             | Details                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Scenario          | Login using valid credentials                                                                                             |
| Priority          | Critical                                                                                                                  |
| Preconditions     | An active NEXORA test account exists                                                                                      |
| Test Data         | Valid email and valid password                                                                                            |
| Test Steps        | 1. Open the NEXORA login page.<br>2. Enter a valid email.<br>3. Enter the correct password.<br>4. Click the Login button. |
| Expected Result   | The user is authenticated and redirected to the NEXORA dashboard                                                          |
| Status            | Ready                                                                                                                     |
| Automation Status | To Be Automated First                                                                                                     |

---

### LOGIN-002 — Incorrect Password

| Field             | Details                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| Scenario          | Login using a valid email and incorrect password                                                         |
| Priority          | Critical                                                                                                 |
| Preconditions     | An active NEXORA test account exists                                                                     |
| Test Data         | Valid email and incorrect password                                                                       |
| Test Steps        | 1. Open the login page.<br>2. Enter a valid email.<br>3. Enter an incorrect password.<br>4. Click Login. |
| Expected Result   | Login is rejected, the user remains on the login page, and a generic authentication error is displayed   |
| Status            | Ready                                                                                                    |
| Automation Status | Planned                                                                                                  |

---

### LOGIN-003 — Unregistered Email

| Field             | Details                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Scenario          | Login using an unregistered email                                                                     |
| Priority          | High                                                                                                  |
| Preconditions     | The supplied email is not registered in NEXORA                                                        |
| Test Data         | Unregistered email and valid-format password                                                          |
| Test Steps        | 1. Open the login page.<br>2. Enter an unregistered email.<br>3. Enter a password.<br>4. Click Login. |
| Expected Result   | Login is rejected and a generic authentication error is displayed                                     |
| Status            | Ready                                                                                                 |
| Automation Status | Planned                                                                                               |

---

### LOGIN-004 — Invalid Email and Invalid Password

| Field             | Details                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| Scenario          | Login when both credentials are invalid                                               |
| Priority          | High                                                                                  |
| Preconditions     | User is on the login page                                                             |
| Test Data         | Unregistered email and incorrect password                                             |
| Test Steps        | 1. Enter an unregistered email.<br>2. Enter an incorrect password.<br>3. Click Login. |
| Expected Result   | Login is rejected and the user remains on the login page                              |
| Status            | Ready                                                                                 |
| Automation Status | Planned                                                                               |

---

### LOGIN-005 — Empty Email Field

| Field             | Details                                                                         |
| ----------------- | ------------------------------------------------------------------------------- |
| Scenario          | Submit the login form without an email                                          |
| Priority          | High                                                                            |
| Preconditions     | User is on the login page                                                       |
| Test Data         | Empty email and a populated password                                            |
| Test Steps        | 1. Leave the email field empty.<br>2. Enter a password.<br>3. Click Login.      |
| Expected Result   | An email-required validation message is displayed and the form is not submitted |
| Status            | Ready                                                                           |
| Automation Status | Planned                                                                         |

---

### LOGIN-006 — Empty Password Field

| Field             | Details                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Scenario          | Submit the login form without a password                                          |
| Priority          | High                                                                              |
| Preconditions     | User is on the login page                                                         |
| Test Data         | Valid email and empty password                                                    |
| Test Steps        | 1. Enter a valid email.<br>2. Leave the password field empty.<br>3. Click Login.  |
| Expected Result   | A password-required validation message is displayed and the form is not submitted |
| Status            | Ready                                                                             |
| Automation Status | Planned                                                                           |

---

### LOGIN-007 — Both Fields Empty

| Field             | Details                                                          |
| ----------------- | ---------------------------------------------------------------- |
| Scenario          | Submit the login form without entering any credentials           |
| Priority          | High                                                             |
| Preconditions     | User is on the login page                                        |
| Test Data         | Empty email and empty password                                   |
| Test Steps        | 1. Leave both fields empty.<br>2. Click Login.                   |
| Expected Result   | Required-field validation messages are displayed for both fields |
| Status            | Ready                                                            |
| Automation Status | Planned                                                          |

---

### LOGIN-008 — Invalid Email Format

| Field             | Details                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Scenario          | Enter an incorrectly formatted email address                                 |
| Priority          | Medium                                                                       |
| Preconditions     | User is on the login page                                                    |
| Test Data         | `pranidhi@` or another invalid email format                                  |
| Test Steps        | 1. Enter an invalid email format.<br>2. Enter a password.<br>3. Click Login. |
| Expected Result   | An email-format validation message is displayed and login is not attempted   |
| Status            | Planned                                                                      |
| Automation Status | Not Automated                                                                |

---

### LOGIN-009 — Password Masking

| Field             | Details                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Scenario          | Verify that the password is hidden                                                           |
| Priority          | High                                                                                         |
| Preconditions     | User is on the login page                                                                    |
| Test Data         | Any password                                                                                 |
| Test Steps        | 1. Click the password field.<br>2. Enter a password.<br>3. Inspect the displayed characters. |
| Expected Result   | The password is masked and is not displayed as plain text                                    |
| Status            | Ready                                                                                        |
| Automation Status | Planned                                                                                      |

---

### LOGIN-010 — Submit Login Using Enter Key

| Field             | Details                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| Scenario          | Submit valid credentials using the Enter key                                       |
| Priority          | Medium                                                                             |
| Preconditions     | An active NEXORA account exists                                                    |
| Test Data         | Valid email and valid password                                                     |
| Test Steps        | 1. Enter valid credentials.<br>2. Press Enter while focused on the password field. |
| Expected Result   | The login form is submitted and the dashboard opens                                |
| Status            | Planned                                                                            |
| Automation Status | Not Automated                                                                      |

---

### LOGIN-011 — Correct Credentials After a Failed Attempt

| Field             | Details                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario          | Correct the credentials after an unsuccessful login                                                                                               |
| Priority          | Medium                                                                                                                                            |
| Preconditions     | An active NEXORA account exists                                                                                                                   |
| Test Data         | Incorrect password followed by the correct password                                                                                               |
| Test Steps        | 1. Attempt login with an incorrect password.<br>2. Confirm that an error appears.<br>3. Replace it with the correct password.<br>4. Submit again. |
| Expected Result   | The previous error is cleared and the user logs in successfully                                                                                   |
| Status            | Ready                                                                                                                                             |
| Automation Status | Planned                                                                                                                                           |

---

### LOGIN-012 — Direct Dashboard Access Without Login

| Field             | Details                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Scenario          | Open a protected NEXORA page without authentication                          |
| Priority          | Critical                                                                     |
| Preconditions     | No authenticated session exists                                              |
| Test Data         | NEXORA dashboard URL                                                         |
| Test Steps        | 1. Open a new browser context.<br>2. Navigate directly to the dashboard URL. |
| Expected Result   | Access is denied and the user is redirected to the login page                |
| Status            | Ready                                                                        |
| Automation Status | Planned                                                                      |

---

### LOGIN-013 — Successful Logout

| Field             | Details                                                       |
| ----------------- | ------------------------------------------------------------- |
| Scenario          | Log out from an authenticated session                         |
| Priority          | Critical                                                      |
| Preconditions     | User is logged into NEXORA                                    |
| Test Data         | Valid authenticated session                                   |
| Test Steps        | 1. Log in successfully.<br>2. Click the Logout option.        |
| Expected Result   | The session ends and the user is redirected to the login page |
| Status            | Planned                                                       |
| Automation Status | Not Automated                                                 |

---

### LOGIN-014 — Protected Page Access After Logout

| Field             | Details                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- |
| Scenario          | Attempt to return to the dashboard after logout                                    |
| Priority          | Critical                                                                           |
| Preconditions     | User has logged in and then logged out                                             |
| Test Data         | NEXORA dashboard URL                                                               |
| Test Steps        | 1. Log out.<br>2. Use the browser Back button or enter the dashboard URL directly. |
| Expected Result   | The dashboard remains inaccessible and the login page is displayed                 |
| Status            | Planned                                                                            |
| Automation Status | Not Automated                                                                      |

---

### LOGIN-015 — Password Is Not Exposed in the URL

| Field             | Details                                                                           |
| ----------------- | --------------------------------------------------------------------------------- |
| Scenario          | Verify that login credentials are not included in the URL                         |
| Priority          | Critical                                                                          |
| Preconditions     | User is on the login page                                                         |
| Test Data         | Valid or invalid credentials                                                      |
| Test Steps        | 1. Enter credentials.<br>2. Submit the login form.<br>3. Inspect the browser URL. |
| Expected Result   | The email and password are not exposed as URL parameters                          |
| Status            | Ready                                                                             |
| Automation Status | Planned                                                                           |

---

### LOGIN-016 — Generic Authentication Error

| Field             | Details                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario          | Verify that the system does not reveal whether an account exists                                                                                               |
| Priority          | High                                                                                                                                                           |
| Preconditions     | User is on the login page                                                                                                                                      |
| Test Data         | Registered email with wrong password and unregistered email with wrong password                                                                                |
| Test Steps        | 1. Attempt login with a registered email and wrong password.<br>2. Record the error.<br>3. Attempt login with an unregistered email.<br>4. Compare the errors. |
| Expected Result   | Both attempts display the same generic message, such as “Incorrect email or password”                                                                          |
| Status            | Ready                                                                                                                                                          |
| Automation Status | Planned                                                                                                                                                        |

---

### LOGIN-017 — Leading and Trailing Spaces in Email

| Field             | Details                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Scenario          | Enter spaces before and after a valid email                                                                |
| Priority          | Medium                                                                                                     |
| Preconditions     | An active NEXORA account exists                                                                            |
| Test Data         | Valid email containing leading and trailing spaces                                                         |
| Test Steps        | 1. Enter a valid email with spaces before and after it.<br>2. Enter the valid password.<br>3. Click Login. |
| Expected Result   | Spaces are safely trimmed and the credentials are processed according to the approved requirement          |
| Status            | Planned                                                                                                    |
| Automation Status | Not Automated                                                                                              |

---

### LOGIN-018 — Email Address Case Handling

| Field             | Details                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Scenario          | Enter a registered email using uppercase letters                                                          |
| Priority          | Medium                                                                                                    |
| Preconditions     | An active NEXORA account exists                                                                           |
| Test Data         | Registered email containing uppercase letters                                                             |
| Test Steps        | 1. Enter the registered email using uppercase letters.<br>2. Enter the valid password.<br>3. Click Login. |
| Expected Result   | The email is processed according to the approved case-sensitivity requirement                             |
| Status            | Planned                                                                                                   |
| Automation Status | Not Automated                                                                                             |

---

### LOGIN-019 — Multiple Failed Login Attempts

| Field             | Details                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Scenario          | Repeatedly submit incorrect credentials                                                                                               |
| Priority          | High                                                                                                                                  |
| Preconditions     | Account-lockout or rate-limiting functionality is implemented                                                                         |
| Test Data         | Valid email and incorrect password                                                                                                    |
| Test Steps        | 1. Attempt login repeatedly using an incorrect password.<br>2. Reach the configured maximum attempt limit.<br>3. Attempt login again. |
| Expected Result   | The configured lockout or rate-limiting rule is applied without revealing sensitive account information                               |
| Status            | Future                                                                                                                                |
| Automation Status | Not Automated                                                                                                                         |

---

### LOGIN-020 — Session Expiration

| Field             | Details                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Scenario          | Allow an authenticated session to expire                                                                                    |
| Priority          | High                                                                                                                        |
| Preconditions     | Session-expiration functionality is implemented                                                                             |
| Test Data         | Valid authenticated session                                                                                                 |
| Test Steps        | 1. Log in successfully.<br>2. Remain inactive until the configured timeout expires.<br>3. Attempt to open a protected page. |
| Expected Result   | The expired session is rejected and the user is redirected to login                                                         |
| Status            | Future                                                                                                                      |
| Automation Status | Not Automated                                                                                                               |

---

### LOGIN-021 — Refresh Dashboard After Login

| Field             | Details                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Scenario          | Refresh a protected page during a valid session                              |
| Priority          | High                                                                         |
| Preconditions     | User is logged into NEXORA                                                   |
| Test Data         | Valid authenticated session                                                  |
| Test Steps        | 1. Log in successfully.<br>2. Open the dashboard.<br>3. Refresh the browser. |
| Expected Result   | The authenticated session remains valid and the dashboard is displayed       |
| Status            | Planned                                                                      |
| Automation Status | Not Automated                                                                |

---

### LOGIN-022 — Invalid or Expired Authentication Token

| Field             | Details                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Scenario          | Access NEXORA using an invalid or expired token                                               |
| Priority          | Critical                                                                                      |
| Preconditions     | Token-based authentication is implemented                                                     |
| Test Data         | Invalid, modified or expired token                                                            |
| Test Steps        | 1. Create an invalid or expired authentication state.<br>2. Attempt to open a protected page. |
| Expected Result   | The request is rejected, protected data is not displayed, and the user is redirected to login |
| Status            | Future                                                                                        |
| Automation Status | Not Automated                                                                                 |

---

## Role-Based Login and Authorization Test Cases

NEXORA is planned to support the following roles:

* System Administrator
* Procurement Officer / Buyer
* Purchase Approver / Procurement Manager
* Requestor
* Receiver / Warehouse Officer
* Accounts Payable / Finance Officer

The following cases will be executed after the required role-based test accounts are created.

| ID       | Test Scenario                                        | Expected Result                                                                 | Priority | Status | Automation Status |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- | -------- | ------ | ----------------- |
| ROLE-001 | Administrator logs in                                | Administrator dashboard and permitted functions are displayed                   | Critical | Future | Not Automated     |
| ROLE-002 | Procurement Officer logs in                          | Procurement functions are displayed                                             | Critical | Future | Not Automated     |
| ROLE-003 | Purchase Approver logs in                            | Approval worklist and permitted approval functions are displayed                | Critical | Future | Not Automated     |
| ROLE-004 | Buyer attempts to approve or reject a purchase order | Access is denied                                                                | Critical | Future | Not Automated     |
| ROLE-005 | Approver attempts to create or edit a supplier       | Access is denied                                                                | High     | Future | Not Automated     |
| ROLE-006 | Buyer attempts to manage users                       | Access is denied                                                                | Critical | Future | Not Automated     |
| ROLE-007 | Approver attempts to manage users                    | Access is denied                                                                | Critical | Future | Not Automated     |
| ROLE-008 | Administrator accesses user management               | Access is allowed                                                               | Critical | Future | Not Automated     |
| ROLE-009 | User manually enters an unauthorized page URL        | The server rejects access and does not expose protected data                    | Critical | Future | Not Automated     |
| ROLE-010 | User’s name and role are returned after login        | The correct user identity and assigned role are displayed                       | High     | Future | Not Automated     |
| ROLE-011 | Requestor logs in                                    | Request-creation functions are available according to permissions               | High     | Future | Not Automated     |
| ROLE-012 | Receiver logs in                                     | Goods-receipt functions are available according to permissions                  | High     | Future | Not Automated     |
| ROLE-013 | Accounts Payable user logs in                        | Finance and invoice-processing functions are available according to permissions | High     | Future | Not Automated     |

---

## Initial Automation Scope

The following test cases will be automated first:

1. `LOGIN-001` — Successful login
2. `LOGIN-002` — Incorrect password
3. `LOGIN-005` — Empty email field
4. `LOGIN-006` — Empty password field
5. `LOGIN-012` — Direct dashboard access without login

Role-based tests will be automated after the relevant test accounts and permissions have been implemented.

---

## Test Execution Status Definitions

| Status  | Meaning                                                      |
| ------- | ------------------------------------------------------------ |
| Ready   | The feature is available and the test can be executed        |
| Planned | The test case is documented but not yet executed             |
| Future  | The required functionality has not yet been implemented      |
| Passed  | The actual result matches the expected result                |
| Failed  | The actual result does not match the expected result         |
| Blocked | The test cannot be executed because of a dependency or issue |

## Automation Status Definitions

| Automation Status | Meaning                                              |
| ----------------- | ---------------------------------------------------- |
| Not Automated     | Automation development has not started               |
| Planned           | The test is selected for future automation           |
| In Progress       | Automation development has started                   |
| Automated         | The automated test has been implemented and verified |
