import {
  expect,
  test,
  type APIRequestContext,
} from '@playwright/test'

type LoginResponse = {
  access_token: string
  token_type: string
  user: {
    user_id: number
    email: string
  }
}

type AuthenticatedSession = {
  accessToken: string
  userId: number
}

type SupplierResponse = {
  supplier_id: number
  is_active: boolean
}

type CatalogueItemResponse = {
  catalogue_item_id: number
  item_code: string
  item_name: string
  status: string
}

type SupplierItemResponse = {
  supplier_id: number
  catalogue_item_id: number
  purchase_uom_id: number
  unit_price: number | string
  currency_code: string
  minimum_order_quantity:
    | number
    | string
    | null
  effective_from: string
  effective_to: string | null
  active: boolean
}

type UnitOfMeasureResponse = {
  uom_id: number
  uom_code: string
  active: boolean
}

type TaxCodeResponse = {
  tax_code_id: number
  tax_rate: number | string
  is_active: boolean
}

type PurchasingSetup = {
  supplier: SupplierResponse
  catalogueItem: CatalogueItemResponse
  supplierItem: SupplierItemResponse
  unitOfMeasure: UnitOfMeasureResponse
  taxCode: TaxCodeResponse
}

type PurchaseOrderResponse = {
  purchase_order_id: number
  po_number: string
  status: string
  supplier_id: number
  created_by_user_id: number
}

type ApprovalResponse = {
  approval_id: number
  document_type: string
  document_id: number
  approver_user_id: number
  approval_level: number
  status: string
  comments: string | null
  decision_at: string | null
  created_at: string
}

function getAuthorizationHeaders(
  accessToken: string,
) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

async function getAdminSession(
  request: APIRequestContext,
): Promise<AuthenticatedSession> {
  const adminEmail =
    process.env.NEXORA_ADMIN_EMAIL

  const adminPassword =
    process.env.NEXORA_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'NEXORA_ADMIN_EMAIL and NEXORA_ADMIN_PASSWORD must be configured in automation/.env',
    )
  }

  const response = await request.post(
    '/api/v1/auth/login',
    {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    },
  )

  expect(
    response.status(),
    'Administrator login should return HTTP 200',
  ).toBe(200)

  const responseBody =
    (await response.json()) as LoginResponse

  expect(responseBody.access_token).toBeTruthy()
  expect(responseBody.token_type).toBe('bearer')

  expect(
    responseBody.user.user_id,
  ).toBeGreaterThan(0)

  return {
    accessToken: responseBody.access_token,
    userId: responseBody.user.user_id,
  }
}

async function getPurchasingSetup(
  request: APIRequestContext,
  accessToken: string,
): Promise<PurchasingSetup> {
  const headers =
    getAuthorizationHeaders(accessToken)

  const suppliersResponse = await request.get(
    '/api/v1/suppliers',
    {
      headers,
    },
  )

  expect(
    suppliersResponse.status(),
    'Supplier list should return HTTP 200',
  ).toBe(200)

  const suppliers =
    (await suppliersResponse.json()) as SupplierResponse[]

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.is_active,
  )

  expect(
    activeSuppliers.length,
    'At least one active supplier is required',
  ).toBeGreaterThan(0)

  const catalogueResponse = await request.get(
    '/api/v1/catalogue/items',
    {
      headers,
    },
  )

  expect(
    catalogueResponse.status(),
    'Catalogue list should return HTTP 200',
  ).toBe(200)

  const catalogueItems =
    (await catalogueResponse.json()) as CatalogueItemResponse[]

  const activeCatalogueItems =
    catalogueItems.filter(
      (item) =>
        item.status.toUpperCase() === 'ACTIVE',
    )

  expect(
    activeCatalogueItems.length,
    'At least one active catalogue item is required',
  ).toBeGreaterThan(0)

  const uomsResponse = await request.get(
    '/api/v1/catalogue/uoms',
    {
      headers,
    },
  )

  expect(
    uomsResponse.status(),
    'UOM list should return HTTP 200',
  ).toBe(200)

  const unitsOfMeasure =
    (await uomsResponse.json()) as UnitOfMeasureResponse[]

  const taxCodesResponse = await request.get(
    '/api/v1/reference/tax-codes',
    {
      headers,
    },
  )

  expect(
    taxCodesResponse.status(),
    'Tax-code list should return HTTP 200',
  ).toBe(200)

  const taxCodes =
    (await taxCodesResponse.json()) as TaxCodeResponse[]

  const activeTaxCodes = taxCodes.filter(
    (taxCode) => taxCode.is_active,
  )

  expect(
    activeTaxCodes.length,
    'At least one active tax code is required',
  ).toBeGreaterThan(0)

  const taxCode =
    activeTaxCodes.find(
      (item) => Number(item.tax_rate) > 0,
    ) ?? activeTaxCodes[0]

  const today =
    new Date().toISOString().slice(0, 10)

  for (const catalogueItem of activeCatalogueItems) {
    const supplierItemsResponse =
      await request.get(
        `/api/v1/catalogue/items/${catalogueItem.catalogue_item_id}/suppliers`,
        {
          headers,
        },
      )

    if (supplierItemsResponse.status() !== 200) {
      continue
    }

    const supplierItems =
      (await supplierItemsResponse.json()) as SupplierItemResponse[]

    const validSupplierItem =
      supplierItems.find((supplierItem) => {
        const supplierIsActive =
          activeSuppliers.some(
            (supplier) =>
              supplier.supplier_id ===
              supplierItem.supplier_id,
          )

        const hasStarted =
          supplierItem.effective_from <= today

        const hasNotEnded =
          supplierItem.effective_to === null ||
          supplierItem.effective_to >= today

        return (
          supplierItem.active &&
          supplierIsActive &&
          supplierItem.currency_code.toUpperCase() ===
            'AUD' &&
          hasStarted &&
          hasNotEnded
        )
      })

    if (!validSupplierItem) {
      continue
    }

    const supplier =
      activeSuppliers.find(
        (item) =>
          item.supplier_id ===
          validSupplierItem.supplier_id,
      )

    const unitOfMeasure =
      unitsOfMeasure.find(
        (uom) =>
          uom.uom_id ===
            validSupplierItem.purchase_uom_id &&
          uom.active,
      )

    if (!supplier || !unitOfMeasure) {
      continue
    }

    return {
      supplier,
      catalogueItem,
      supplierItem: validSupplierItem,
      unitOfMeasure,
      taxCode,
    }
  }

  throw new Error(
    'No valid active supplier, catalogue item and AUD supplier-pricing combination was found',
  )
}

async function createDraftPurchaseOrder(
  request: APIRequestContext,
  session: AuthenticatedSession,
): Promise<PurchaseOrderResponse> {
  const setup = await getPurchasingSetup(
    request,
    session.accessToken,
  )

  const {
    supplier,
    catalogueItem,
    supplierItem,
    unitOfMeasure,
    taxCode,
  } = setup

  const minimumOrderQuantity =
    supplierItem.minimum_order_quantity === null
      ? 1
      : Number(
          supplierItem.minimum_order_quantity,
        )

  const quantity = Math.max(
    5,
    Math.ceil(minimumOrderQuantity),
  )

  const uniqueValue = Date.now()

  const response = await request.post(
    '/api/v1/purchase-orders',
    {
      headers: getAuthorizationHeaders(
        session.accessToken,
      ),
      data: {
        supplier_id: supplier.supplier_id,
        purchase_request_id: null,
        created_by_user_id: session.userId,
        warehouse_id: null,
        receiving_location_id: null,
        currency: 'AUD',
        delivery_address:
          'NEXORA Approval Test Warehouse',
        notes:
          `Approval API test ${uniqueValue}`,
        expected_delivery_date:
          new Date(
            Date.now() +
              14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        items: [
          {
            item_code:
              catalogueItem.item_code,
            description:
              catalogueItem.item_name,
            quantity,
            unit_of_measure:
              unitOfMeasure.uom_code,
            unit_price:
              Number(supplierItem.unit_price),
            tax_code_id:
              taxCode.tax_code_id,
            notes:
              'Created for approval testing',
          },
        ],
      },
    },
  )

  const responseBody = await response.json()

  expect(
    response.status(),
    `Purchase Order creation failed: ${JSON.stringify(responseBody)}`,
  ).toBe(201)

  const purchaseOrder =
    responseBody as PurchaseOrderResponse

  expect(
    purchaseOrder.purchase_order_id,
  ).toBeGreaterThan(0)

  expect(purchaseOrder.status).toBe('DRAFT')

  return purchaseOrder
}

async function createPendingApproval(
  request: APIRequestContext,
  session: AuthenticatedSession,
  purchaseOrderId: number,
): Promise<ApprovalResponse> {
  const response = await request.post(
    '/api/v1/approvals',
    {
      headers: getAuthorizationHeaders(
        session.accessToken,
      ),
      data: {
        document_type: 'PURCHASE_ORDER',
        document_id: purchaseOrderId,
        approver_user_id: session.userId,
        approval_level: 1,
        comments:
          'Submitted by Playwright API automation',
      },
    },
  )

  const responseBody = await response.json()

  expect(
    response.status(),
    `Approval creation failed: ${JSON.stringify(responseBody)}`,
  ).toBe(201)

  const approval =
    responseBody as ApprovalResponse

  expect(
    approval.approval_id,
  ).toBeGreaterThan(0)

  expect(approval.document_type).toBe(
    'PURCHASE_ORDER',
  )

  expect(approval.document_id).toBe(
    purchaseOrderId,
  )

  expect(approval.approver_user_id).toBe(
    session.userId,
  )

  expect(approval.status).toBe('PENDING')
  expect(approval.decision_at).toBeNull()

  return approval
}

async function getPurchaseOrder(
  request: APIRequestContext,
  accessToken: string,
  purchaseOrderId: number,
): Promise<PurchaseOrderResponse> {
  const response = await request.get(
    `/api/v1/purchase-orders/${purchaseOrderId}`,
    {
      headers:
        getAuthorizationHeaders(accessToken),
    },
  )

  const responseBody = await response.json()

  expect(
    response.status(),
    `Purchase Order retrieval failed: ${JSON.stringify(responseBody)}`,
  ).toBe(200)

  return responseBody as PurchaseOrderResponse
}

async function getApproval(
  request: APIRequestContext,
  accessToken: string,
  approvalId: number,
): Promise<ApprovalResponse> {
  const response = await request.get(
    `/api/v1/approvals/${approvalId}`,
    {
      headers:
        getAuthorizationHeaders(accessToken),
    },
  )

  const responseBody = await response.json()

  expect(
    response.status(),
    `Approval retrieval failed: ${JSON.stringify(responseBody)}`,
  ).toBe(200)

  return responseBody as ApprovalResponse
}

test.describe('NEXORA Approval API', () => {
  test(
    'APR-REQ-004 - authenticated user can retrieve approvals',
    async ({ request }) => {
      const { accessToken } =
        await getAdminSession(request)

      const response = await request.get(
        '/api/v1/approvals',
        {
          headers:
            getAuthorizationHeaders(
              accessToken,
            ),
        },
      )

      expect(response.status()).toBe(200)

      const responseBody = await response.json()

      expect(
        Array.isArray(responseBody),
      ).toBe(true)
    },
  )

  test(
    'SEC-REQ-002 - unauthenticated approval access is rejected',
    async ({ request }) => {
      const response = await request.get(
        '/api/v1/approvals',
      )

      expect(response.status()).toBe(401)

      const responseBody = await response.json()

      expect(responseBody.detail).toBe(
        'Invalid or missing authentication token',
      )
    },
  )

  test(
    'SEC-REQ-002 - invalid approval access token is rejected',
    async ({ request }) => {
      const response = await request.get(
        '/api/v1/approvals',
        {
          headers: {
            Authorization:
              'Bearer this-is-an-invalid-token',
          },
        },
      )

      expect(response.status()).toBe(401)

      const responseBody = await response.json()

      expect(responseBody.detail).toBe(
        'Invalid or missing authentication token',
      )
    },
  )

  test(
    'APR-REQ-001 - purchase order can be submitted and approved',
    async ({ request }) => {
      const session =
        await getAdminSession(request)

      const draftPurchaseOrder =
        await createDraftPurchaseOrder(
          request,
          session,
        )

      const pendingApproval =
        await createPendingApproval(
          request,
          session,
          draftPurchaseOrder.purchase_order_id,
        )

      const pendingPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        pendingPurchaseOrder.status,
      ).toBe('PENDING_APPROVAL')

      const decisionResponse =
        await request.patch(
          `/api/v1/approvals/${pendingApproval.approval_id}/decision`,
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              status: 'APPROVED',
              comments:
                'Approved by Playwright API automation',
            },
          },
        )

      const decisionBody =
        await decisionResponse.json()

      expect(
        decisionResponse.status(),
        `Approval decision failed: ${JSON.stringify(decisionBody)}`,
      ).toBe(200)

      const approvedApproval =
        decisionBody as ApprovalResponse

      expect(approvedApproval.status).toBe(
        'APPROVED',
      )

      expect(
        approvedApproval.decision_at,
      ).toBeTruthy()

      expect(approvedApproval.comments).toBe(
        'Approved by Playwright API automation',
      )

      const approvedPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        approvedPurchaseOrder.status,
      ).toBe('APPROVED')
    },
  )

  test(
    'APR-REQ-002 - purchase order approval can be rejected',
    async ({ request }) => {
      const session =
        await getAdminSession(request)

      const draftPurchaseOrder =
        await createDraftPurchaseOrder(
          request,
          session,
        )

      const pendingApproval =
        await createPendingApproval(
          request,
          session,
          draftPurchaseOrder.purchase_order_id,
        )

      const pendingPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        pendingPurchaseOrder.status,
      ).toBe('PENDING_APPROVAL')

      const decisionResponse =
        await request.patch(
          `/api/v1/approvals/${pendingApproval.approval_id}/decision`,
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              status: 'REJECTED',
              comments:
                'Rejected because the test order requires correction',
            },
          },
        )

      const decisionBody =
        await decisionResponse.json()

      expect(
        decisionResponse.status(),
        `Rejection failed: ${JSON.stringify(decisionBody)}`,
      ).toBe(200)

      const rejectedApproval =
        decisionBody as ApprovalResponse

      expect(rejectedApproval.status).toBe(
        'REJECTED',
      )

      expect(
        rejectedApproval.decision_at,
      ).toBeTruthy()

      expect(rejectedApproval.comments).toBe(
        'Rejected because the test order requires correction',
      )

      const rejectedPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        rejectedPurchaseOrder.status,
      ).toBe('REJECTED')
    },
  )

  test(
    'APR-REQ-003 - duplicate pending approval is rejected',
    async ({ request }) => {
      const session =
        await getAdminSession(request)

      const draftPurchaseOrder =
        await createDraftPurchaseOrder(
          request,
          session,
        )

      const firstApproval =
        await createPendingApproval(
          request,
          session,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(firstApproval.status).toBe(
        'PENDING',
      )

      const duplicateResponse =
        await request.post(
          '/api/v1/approvals',
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              document_type:
                'PURCHASE_ORDER',
              document_id:
                draftPurchaseOrder.purchase_order_id,
              approver_user_id:
                session.userId,
              approval_level: 1,
              comments:
                'Duplicate pending approval',
            },
          },
        )

      const duplicateBody =
        await duplicateResponse.json()

      expect(
        duplicateResponse.status(),
        `Unexpected duplicate response: ${JSON.stringify(duplicateBody)}`,
      ).toBe(400)

      expect(duplicateBody.detail).toBe(
        'A pending approval already exists for this document.',
      )

      const purchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(purchaseOrder.status).toBe(
        'PENDING_APPROVAL',
      )
    },
  )

  test(
    'APR-REQ-005 - invalid approval decision is rejected',
    async ({ request }) => {
      const session =
        await getAdminSession(request)

      const draftPurchaseOrder =
        await createDraftPurchaseOrder(
          request,
          session,
        )

      const pendingApproval =
        await createPendingApproval(
          request,
          session,
          draftPurchaseOrder.purchase_order_id,
        )

      const invalidDecisionResponse =
        await request.patch(
          `/api/v1/approvals/${pendingApproval.approval_id}/decision`,
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              status: 'COMPLETED',
              comments:
                'Unsupported decision value',
            },
          },
        )

      const invalidDecisionBody =
        await invalidDecisionResponse.json()

      expect(
        invalidDecisionResponse.status(),
        `Unexpected decision response: ${JSON.stringify(invalidDecisionBody)}`,
      ).toBe(400)

      expect(invalidDecisionBody.detail).toBe(
        'Approval status must be APPROVED or REJECTED.',
      )

      const unchangedApproval =
        await getApproval(
          request,
          session.accessToken,
          pendingApproval.approval_id,
        )

      expect(
        unchangedApproval.status,
      ).toBe('PENDING')

      expect(
        unchangedApproval.decision_at,
      ).toBeNull()

      const unchangedPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        unchangedPurchaseOrder.status,
      ).toBe('PENDING_APPROVAL')
    },
  )

  test(
    'APR-REQ-006 - decided approval cannot be decided again',
    async ({ request }) => {
      const session =
        await getAdminSession(request)

      const draftPurchaseOrder =
        await createDraftPurchaseOrder(
          request,
          session,
        )

      const pendingApproval =
        await createPendingApproval(
          request,
          session,
          draftPurchaseOrder.purchase_order_id,
        )

      // First decision: approve successfully.
      const firstDecisionResponse =
        await request.patch(
          `/api/v1/approvals/${pendingApproval.approval_id}/decision`,
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              status: 'APPROVED',
              comments:
                'First approval decision',
            },
          },
        )

      const firstDecisionBody =
        await firstDecisionResponse.json()

      expect(
        firstDecisionResponse.status(),
        `First decision failed: ${JSON.stringify(firstDecisionBody)}`,
      ).toBe(200)

      const approvedApproval =
        firstDecisionBody as ApprovalResponse

      expect(approvedApproval.status).toBe(
        'APPROVED',
      )

      expect(
        approvedApproval.decision_at,
      ).toBeTruthy()

      // Second decision: try to reject the same Approval.
      const secondDecisionResponse =
        await request.patch(
          `/api/v1/approvals/${pendingApproval.approval_id}/decision`,
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              status: 'REJECTED',
              comments:
                'Second decision should be rejected',
            },
          },
        )

      const secondDecisionBody =
        await secondDecisionResponse.json()

      expect(
        secondDecisionResponse.status(),
        `Unexpected second-decision response: ${JSON.stringify(secondDecisionBody)}`,
      ).toBe(400)

      expect(secondDecisionBody.detail).toBe(
        'Only a PENDING approval can be decided.',
      )

      // Confirm the original Approval remains APPROVED.
      const unchangedApproval =
        await getApproval(
          request,
          session.accessToken,
          pendingApproval.approval_id,
        )

      expect(
        unchangedApproval.status,
      ).toBe('APPROVED')

      expect(unchangedApproval.comments).toBe(
        'First approval decision',
      )

      // Confirm the linked Purchase Order remains APPROVED.
      const unchangedPurchaseOrder =
        await getPurchaseOrder(
          request,
          session.accessToken,
          draftPurchaseOrder.purchase_order_id,
        )

      expect(
        unchangedPurchaseOrder.status,
      ).toBe('APPROVED')
    },
  )

  test(
    'APR-REQ-007 - nonexistent approval returns 404',
    async ({ request }) => {
      const { accessToken } =
        await getAdminSession(request)

      const nonexistentApprovalId =
        2_147_483_647

      const response = await request.get(
        `/api/v1/approvals/${nonexistentApprovalId}`,
        {
          headers:
            getAuthorizationHeaders(
              accessToken,
            ),
        },
      )

      const responseBody =
        await response.json()

      expect(
        response.status(),
        `Unexpected response: ${JSON.stringify(responseBody)}`,
      ).toBe(404)

      expect(responseBody.detail).toBe(
        'Approval not found.',
      )
    },
  )



})