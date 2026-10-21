## NEXORA Phase 1 — Procurement Quality Engineering

This folder contains the sanitised Quality Engineering documentation, automation evidence, and execution baseline for NEXORA Phase 1 Procurement.

## Scope

Phase 1 covers the following procurement capabilities:

- Supplier Management
- Warehouse Management
- Purchase Requests
- Approval Workflow
- Purchase Orders
- Goods Receipt
- Catalogue and Reference Data
- Inventory Updates
- Authentication and Authorisation

## Quality Engineering Documents

- [Phase 1 Procurement Test Plan](./NEXORA-Phase-1-Procurement-Test-Plan.pdf)
- [Test Control Workbook](./NEXORA-Phase-1-Test-Control-Workbook.xlsx)

## Test Design Baseline

The Phase 1 test assets include:

- 46 traceable requirements
- 74 planned test cases
- 46 critical test cases
- 14 functional-security test cases
- 12 documented project and quality risks

> The 74 planned test cases form the complete test catalogue. Stable, repeatable, and high-value scenarios were prioritised for automation.

## Automation Completed

The Phase 1 automation baseline has been implemented using Playwright and TypeScript.

Current verified execution results:

- 48 API and data-layer automated checks passed
- 37 Chromium UI automated checks passed
- API authentication and authorisation checks completed
- Positive and negative API validation completed
- Database connectivity verification completed
- UI, API, and database three-layer validation completed
- Procurement business workflows automated
- GitHub Actions regression workflow configured

## Automated Coverage

### Authentication and Security

- Valid administrator authentication
- Unauthenticated request rejection
- Invalid-token rejection
- Protected procurement endpoint verification
- Request validation and error-response verification

### Supplier Management

- Retrieve suppliers
- Create suppliers
- Update suppliers
- Duplicate and invalid supplier validation
- Authentication and authorisation checks

### Purchase Requests

- Retrieve and create purchase requests
- Validate request lines and calculated totals
- Validate required fields and invalid values
- Verify purchase request creation through UI, API, and database layers

### Purchase Orders

- Retrieve and create purchase orders
- Supplier, catalogue item, tax code, and currency validation
- Purchase order total and tax calculation checks
- Invalid reference and business-rule validation

### Approval Workflow

- Submit purchase orders for approval
- Approve and reject approval requests
- Validate approval status transitions
- Verify rejection-comment rules
- Prevent invalid and repeated decisions

### Goods Receipt and Inventory

- Retrieve and create goods receipts
- Validate purchase order eligibility
- Validate received and rejected quantities
- Verify partial and complete receipt behaviour
- Verify inventory balance updates
- Verify inventory transaction creation
- Verify purchase order status updates after receipt

### Catalogue and Reference Data

- Catalogue item retrieval
- Supplier-item relationship validation
- Unit-of-measure retrieval
- Tax-code retrieval
- Currency and exchange-rate validation

## Database and Three-Layer Validation

Database validation is included in the automation baseline.

The implemented checks include:

- Direct PostgreSQL connectivity verification
- Created-record verification
- Inventory balance verification
- Inventory transaction verification
- Source document and line-reference verification
- Before-and-after database value comparison
- UI → API response → PostgreSQL record validation

## Automation Evidence

- [API Tests](../../automation/tests/api/)
- [UI and Procurement Tests](../../automation/tests/procurement/)
- [Playwright Configuration](../../automation/playwright.config.ts)
- [GitHub Actions Workflow](../../.github/workflows/playwright.yml)

## Continuous Integration

The Chromium regression suite is configured to run through GitHub Actions.

The workflow provisions:

- PostgreSQL 16
- Python and the FastAPI backend
- Node.js and the frontend application
- Playwright with Chromium
- Test reports, logs, traces, and execution artifacts

A dedicated API-project job can be added to the CI workflow as a future enhancement.

## Current Status

The Phase 1 Quality Engineering and automation baseline is complete.

Completed work includes:

- Requirements and test-case traceability
- Risk-based test planning
- Functional API automation
- Functional-security automation
- Browser-based UI automation
- Database verification
- Three-layer UI/API/database validation
- Procurement workflow regression coverage
- CI/CD regression execution

This does not mean that every one of the 74 planned test cases has been automated. The automation currently covers the stable and high-value regression scenarios selected from the complete test catalogue.

## Standards Alignment

The documentation structure is aligned with ISO/IEC/IEEE 29119 test-process and test-documentation principles.

This alignment does not represent formal ISO certification.

## Next Phase — AI-Assisted Quality Engineering

The next phase will introduce an AI-assisted Quality Engineering foundation.

Planned activities include:

1. Create a controlled QA knowledge base
2. Ingest requirements, test cases, risks, and execution evidence
3. Implement document chunking and metadata
4. Build retrieval with source citations
5. Add LLM-assisted requirement and test-case analysis
6. Evaluate response accuracy, relevance, and groundedness
7. Introduce LangGraph workflow orchestration
8. Explore AI agents for test analysis and regression assistance
9. Add security, observability, and human-review controls