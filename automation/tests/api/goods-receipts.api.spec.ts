import {
  expect,
  test,
  type APIRequestContext,
} from '@playwright/test'

import {
  closeDatabase,
  queryDatabase,
} from '../fixtures/database'

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

type PurchaseOrderItemResponse = {
  purchase_order_item_id: number
  purchase_order_id: number
  item_code: string | null
  description: string
  quantity: number
  unit_of_measure: string
}

type PurchaseOrderResponse = {
  purchase_order_id: number
  po_number: string
  supplier_id: number
  created_by_user_id: number
  status: string
  currency: string
  items: PurchaseOrderItemResponse[]
}

type ApprovalResponse = {
  approval_id: number
  document_type: string
  document_id: number
  approver_user_id: number
  status: string
  decision_at: string | null
}

type GoodsReceiptItemResponse = {
  goods_receipt_item_id: number
  goods_receipt_id: number
  purchase_order_item_id: number
  item_code: string | null
  description: string
  ordered_quantity: number
  received_quantity: number
  rejected_quantity: number
  unit_of_measure: string
  notes: string | null
}

type GoodsReceiptResponse = {
  goods_receipt_id: number
  receipt_number: string
  purchase_order_id: number
  received_by_user_id: number
  status: string
  delivery_reference: string | null
  notes: string | null
  received_at: string
  created_at: string
  items: GoodsReceiptItemResponse[]
}

type CatalogueItemDatabaseRow = {
  catalogue_item_id: string
}

type InventoryBalanceDatabaseRow = {
  on_hand_quantity: string
  available_quantity: string
  quarantine_quantity: string
}

type InventoryTransactionDatabaseRow = {
  catalogue_item_id: string
  transaction_type: string
  quantity: string
  unit_of_measure: string
  source_document_type: string
  source_document_id: string
  source_line_id: string
  reference_number: string | null
  created_by_user_id: string
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

async function createApprovedPurchaseOrder(
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
    10,
    Math.ceil(minimumOrderQuantity),
  )

  const uniqueValue = Date.now()

  // Create a DRAFT Purchase Order.
  const createPoResponse = await request.post(
    '/api/v1/purchase-orders',
    {
      headers:
        getAuthorizationHeaders(
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
          'NEXORA Goods Receipt Warehouse',
        notes:
          `Goods Receipt workflow ${uniqueValue}`,
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
              'Created for Goods Receipt testing',
          },
        ],
      },
    },
  )

  const createPoBody =
    await createPoResponse.json()

  expect(
    createPoResponse.status(),
    `Purchase Order creation failed: ${JSON.stringify(createPoBody)}`,
  ).toBe(201)

  const draftPurchaseOrder =
    createPoBody as PurchaseOrderResponse

  expect(
    draftPurchaseOrder.purchase_order_id,
  ).toBeGreaterThan(0)

  expect(
    draftPurchaseOrder.status,
  ).toBe('DRAFT')

  expect(
    draftPurchaseOrder.items,
  ).toHaveLength(1)

  // Submit the Purchase Order for approval.
  const approvalResponse = await request.post(
    '/api/v1/approvals',
    {
      headers:
        getAuthorizationHeaders(
          session.accessToken,
        ),
      data: {
        document_type: 'PURCHASE_ORDER',
        document_id:
          draftPurchaseOrder.purchase_order_id,
        approver_user_id: session.userId,
        approval_level: 1,
        comments:
          'Submitted for Goods Receipt testing',
      },
    },
  )

  const approvalBody =
    await approvalResponse.json()

  expect(
    approvalResponse.status(),
    `Approval creation failed: ${JSON.stringify(approvalBody)}`,
  ).toBe(201)

  const pendingApproval =
    approvalBody as ApprovalResponse

  expect(
    pendingApproval.approval_id,
  ).toBeGreaterThan(0)

  expect(pendingApproval.status).toBe(
    'PENDING',
  )

  // Approve the Purchase Order.
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
            'Approved for Goods Receipt testing',
        },
      },
    )

  const decisionBody =
    await decisionResponse.json()

  expect(
    decisionResponse.status(),
    `Approval decision failed: ${JSON.stringify(decisionBody)}`,
  ).toBe(200)

  const approvedDecision =
    decisionBody as ApprovalResponse

  expect(
    approvedDecision.status,
  ).toBe('APPROVED')

  // Retrieve the updated Purchase Order.
  const getPoResponse = await request.get(
    `/api/v1/purchase-orders/${draftPurchaseOrder.purchase_order_id}`,
    {
      headers:
        getAuthorizationHeaders(
          session.accessToken,
        ),
    },
  )

  const getPoBody =
    await getPoResponse.json()

  expect(
    getPoResponse.status(),
    `Purchase Order retrieval failed: ${JSON.stringify(getPoBody)}`,
  ).toBe(200)

  const approvedPurchaseOrder =
    getPoBody as PurchaseOrderResponse

  expect(
    approvedPurchaseOrder.status,
  ).toBe('APPROVED')

  return approvedPurchaseOrder
}

test.describe(
  'NEXORA Goods Receipt API',
  () => {
    test.afterAll(async () => {
      await closeDatabase()
    })

    test(
      'GR-REQ-004 - authenticated user can retrieve goods receipts',
      async ({ request }) => {
        const { accessToken } =
          await getAdminSession(request)

        const response = await request.get(
          '/api/v1/goods-receipts',
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
        ).toBe(200)

        expect(
          Array.isArray(responseBody),
        ).toBe(true)
      },
    )

    test(
      'SEC-REQ-002 - unauthenticated goods receipt access is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/goods-receipts',
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(401)

        expect(responseBody.detail).toBe(
          'Invalid or missing authentication token',
        )
      },
    )

    test(
      'SEC-REQ-002 - invalid goods receipt access token is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/goods-receipts',
          {
            headers: {
              Authorization:
                'Bearer this-is-an-invalid-token',
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(401)

        expect(responseBody.detail).toBe(
          'Invalid or missing authentication token',
        )
      },
    )

    test(
      'GR-REQ-005 - receipt for nonexistent purchase order is rejected',
      async ({ request }) => {
        const { accessToken, userId } =
          await getAdminSession(request)

        const response = await request.post(
          '/api/v1/goods-receipts',
          {
            headers:
              getAuthorizationHeaders(
                accessToken,
              ),
            data: {
              purchase_order_id:
                2_147_483_647,
              received_by_user_id: userId,
              delivery_reference:
                'INVALID-PO-TEST',
              notes:
                'This receipt must be rejected',
              items: [
                {
                  purchase_order_item_id:
                    2_147_483_647,
                  item_code: 'INVALID-ITEM',
                  description:
                    'Nonexistent purchase order item',
                  ordered_quantity: 10,
                  received_quantity: 10,
                  rejected_quantity: 0,
                  unit_of_measure: 'EA',
                  notes:
                    'Negative API test',
                },
              ],
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(400)

        expect(responseBody.detail).toBe(
          'Purchase order not found.',
        )
      },
    )

    test(
      'GR-REQ-006 - negative received quantity is rejected',
      async ({ request }) => {
        const { accessToken, userId } =
          await getAdminSession(request)

        const response = await request.post(
          '/api/v1/goods-receipts',
          {
            headers:
              getAuthorizationHeaders(
                accessToken,
              ),
            data: {
              purchase_order_id: 1,
              received_by_user_id: userId,
              delivery_reference:
                'NEGATIVE-QTY-TEST',
              notes:
                'Negative quantity validation test',
              items: [
                {
                  purchase_order_item_id: 1,
                  item_code: 'TEST-ITEM',
                  description:
                    'Negative quantity test item',
                  ordered_quantity: 10,
                  received_quantity: -1,
                  rejected_quantity: 0,
                  unit_of_measure: 'EA',
                  notes:
                    'This payload must be rejected',
                },
              ],
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(422)

        expect(
          Array.isArray(responseBody.detail),
        ).toBe(true)

        const receivedQuantityError =
          responseBody.detail.some(
            (error: {
              loc?: Array<string | number>
            }) =>
              error.loc?.includes(
                'received_quantity',
              ),
          )

        expect(
          receivedQuantityError,
          'Validation error should identify received_quantity',
        ).toBe(true)
      },
    )

    test(
      'GR-REQ-007 - nonexistent goods receipt returns 404',
      async ({ request }) => {
        const { accessToken } =
          await getAdminSession(request)

        const nonexistentReceiptId =
          2_147_483_647

        const response = await request.get(
          `/api/v1/goods-receipts/${nonexistentReceiptId}`,
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
          'Goods receipt not found.',
        )
      },
    )

    test(
      'GR-REQ-001 - full receipt changes approved purchase order to received',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        // Step 1: Create and approve a PO.
        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        expect(
          approvedPurchaseOrder.status,
        ).toBe('APPROVED')

        expect(
          approvedPurchaseOrder.items,
        ).toHaveLength(1)

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        // Step 2: Receive the full ordered quantity.
        const uniqueValue = Date.now()

        const createReceiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `DEL-${uniqueValue}`,
                notes:
                  'Full receipt created by Playwright',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      orderedQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Full quantity received',
                  },
                ],
              },
            },
          )

        const createReceiptBody =
          await createReceiptResponse.json()

        expect(
          createReceiptResponse.status(),
          `Goods Receipt creation failed: ${JSON.stringify(createReceiptBody)}`,
        ).toBe(201)

        const createdReceipt =
          createReceiptBody as GoodsReceiptResponse

        expect(
          createdReceipt.goods_receipt_id,
        ).toBeGreaterThan(0)

        expect(
          createdReceipt.receipt_number,
        ).toBeTruthy()

        expect(
          createdReceipt.purchase_order_id,
        ).toBe(
          approvedPurchaseOrder.purchase_order_id,
        )

        expect(
          createdReceipt.received_by_user_id,
        ).toBe(session.userId)

        expect(createdReceipt.status).toBe(
          'RECEIVED',
        )

        expect(
          createdReceipt.delivery_reference,
        ).toBe(`DEL-${uniqueValue}`)

        expect(
          createdReceipt.items,
        ).toHaveLength(1)

        const createdReceiptItem =
          createdReceipt.items[0]

        expect(
          createdReceiptItem.purchase_order_item_id,
        ).toBe(
          purchaseOrderItem.purchase_order_item_id,
        )

        expect(
          Number(
            createdReceiptItem.ordered_quantity,
          ),
        ).toBeCloseTo(orderedQuantity, 2)

        expect(
          Number(
            createdReceiptItem.received_quantity,
          ),
        ).toBeCloseTo(orderedQuantity, 2)

        expect(
          Number(
            createdReceiptItem.rejected_quantity,
          ),
        ).toBeCloseTo(0, 2)

        expect(
          createdReceiptItem.unit_of_measure,
        ).toBe(
          purchaseOrderItem.unit_of_measure,
        )

        expect(
          createdReceipt.received_at,
        ).toBeTruthy()

        expect(
          createdReceipt.created_at,
        ).toBeTruthy()

        // Step 3: Retrieve the Goods Receipt.
        const getReceiptResponse =
          await request.get(
            `/api/v1/goods-receipts/${createdReceipt.goods_receipt_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        const getReceiptBody =
          await getReceiptResponse.json()

        expect(
          getReceiptResponse.status(),
          `Goods Receipt retrieval failed: ${JSON.stringify(getReceiptBody)}`,
        ).toBe(200)

        const retrievedReceipt =
          getReceiptBody as GoodsReceiptResponse

        expect(
          retrievedReceipt.goods_receipt_id,
        ).toBe(createdReceipt.goods_receipt_id)

        expect(
          retrievedReceipt.receipt_number,
        ).toBe(createdReceipt.receipt_number)

        expect(
          retrievedReceipt.purchase_order_id,
        ).toBe(
          approvedPurchaseOrder.purchase_order_id,
        )

        expect(
          Number(
            retrievedReceipt.items[0]
              .received_quantity,
          ),
        ).toBeCloseTo(orderedQuantity, 2)

        // Step 4: Verify the PO is now RECEIVED.
        const updatedPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        const updatedPoBody =
          await updatedPoResponse.json()

        expect(
          updatedPoResponse.status(),
          `Purchase Order retrieval failed: ${JSON.stringify(updatedPoBody)}`,
        ).toBe(200)

        const receivedPurchaseOrder =
          updatedPoBody as PurchaseOrderResponse

        expect(
          receivedPurchaseOrder.status,
        ).toBe('RECEIVED')
      },
    )
      test(
      'GR-REQ-002 - partial receipt changes purchase order to partially received',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        // Step 1: Create and approve a Purchase Order.
        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        expect(
          approvedPurchaseOrder.status,
        ).toBe('APPROVED')

        expect(
          approvedPurchaseOrder.items,
        ).toHaveLength(1)

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        const partialQuantity =
          Math.max(
            1,
            Math.floor(orderedQuantity / 2),
          )

        expect(
          partialQuantity,
        ).toBeLessThan(orderedQuantity)

        const uniqueValue = Date.now()

        // Step 2: Receive only part of the order.
        const receiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `PARTIAL-${uniqueValue}`,
                notes:
                  'Partial receipt created by Playwright',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      partialQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Partial quantity received',
                  },
                ],
              },
            },
          )

        const receiptBody =
          await receiptResponse.json()

        expect(
          receiptResponse.status(),
          `Partial Goods Receipt creation failed: ${JSON.stringify(receiptBody)}`,
        ).toBe(201)

        const partialReceipt =
          receiptBody as GoodsReceiptResponse

        expect(
          partialReceipt.goods_receipt_id,
        ).toBeGreaterThan(0)

        expect(
          partialReceipt.purchase_order_id,
        ).toBe(
          approvedPurchaseOrder.purchase_order_id,
        )

        expect(
          partialReceipt.status,
        ).toBe('RECEIVED')

        expect(
          partialReceipt.items,
        ).toHaveLength(1)

        expect(
          Number(
            partialReceipt.items[0]
              .received_quantity,
          ),
        ).toBeCloseTo(partialQuantity, 2)

        expect(
          Number(
            partialReceipt.items[0]
              .rejected_quantity,
          ),
        ).toBeCloseTo(0, 2)

        // Step 3: Verify the PO is only partially received.
        const updatedPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        const updatedPoBody =
          await updatedPoResponse.json()

        expect(
          updatedPoResponse.status(),
          `Purchase Order retrieval failed: ${JSON.stringify(updatedPoBody)}`,
        ).toBe(200)

        const updatedPurchaseOrder =
          updatedPoBody as PurchaseOrderResponse

        expect(
          updatedPurchaseOrder.status,
        ).toBe('PARTIALLY_RECEIVED')
      },
    )

    test(
      'GR-REQ-003 - second receipt completes a partially received purchase order',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        const firstQuantity =
          Math.max(
            1,
            Math.floor(orderedQuantity / 2),
          )

        const remainingQuantity =
          orderedQuantity - firstQuantity

        expect(firstQuantity).toBeGreaterThan(0)

        expect(
          remainingQuantity,
        ).toBeGreaterThan(0)

        const headers =
          getAuthorizationHeaders(
            session.accessToken,
          )

        // Step 1: Create the first partial receipt.
        const firstReceiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers,
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `FIRST-${Date.now()}`,
                notes:
                  'First partial delivery',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      firstQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'First partial quantity',
                  },
                ],
              },
            },
          )

        const firstReceiptBody =
          await firstReceiptResponse.json()

        expect(
          firstReceiptResponse.status(),
          `First receipt failed: ${JSON.stringify(firstReceiptBody)}`,
        ).toBe(201)

        const firstReceipt =
          firstReceiptBody as GoodsReceiptResponse

        expect(
          firstReceipt.goods_receipt_id,
        ).toBeGreaterThan(0)

        expect(
          Number(
            firstReceipt.items[0]
              .received_quantity,
          ),
        ).toBeCloseTo(firstQuantity, 2)

        // Step 2: Confirm the PO is partially received.
        const partialPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers,
            },
          )

        expect(
          partialPoResponse.status(),
        ).toBe(200)

        const partialPurchaseOrder =
          (await partialPoResponse.json()) as PurchaseOrderResponse

        expect(
          partialPurchaseOrder.status,
        ).toBe('PARTIALLY_RECEIVED')

        // Step 3: Receive the remaining quantity.
        const secondReceiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers,
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `SECOND-${Date.now()}`,
                notes:
                  'Final delivery',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      remainingQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Remaining quantity received',
                  },
                ],
              },
            },
          )

        const secondReceiptBody =
          await secondReceiptResponse.json()

        expect(
          secondReceiptResponse.status(),
          `Second receipt failed: ${JSON.stringify(secondReceiptBody)}`,
        ).toBe(201)

        const secondReceipt =
          secondReceiptBody as GoodsReceiptResponse

        expect(
          secondReceipt.goods_receipt_id,
        ).toBeGreaterThan(0)

        expect(
          secondReceipt.goods_receipt_id,
        ).not.toBe(
          firstReceipt.goods_receipt_id,
        )

        expect(
          Number(
            secondReceipt.items[0]
              .received_quantity,
          ),
        ).toBeCloseTo(remainingQuantity, 2)

        // Step 4: Validate the cumulative quantity.
        const totalReceived =
          Number(
            firstReceipt.items[0]
              .received_quantity,
          ) +
          Number(
            secondReceipt.items[0]
              .received_quantity,
          )

        expect(
          totalReceived,
        ).toBeCloseTo(orderedQuantity, 2)

        // Step 5: Confirm the PO is fully received.
        const completedPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers,
            },
          )

        expect(
          completedPoResponse.status(),
        ).toBe(200)

        const completedPurchaseOrder =
          (await completedPoResponse.json()) as PurchaseOrderResponse

        expect(
          completedPurchaseOrder.status,
        ).toBe('RECEIVED')
      },
    )
    test(
      'GR-REQ-008 - received quantity cannot exceed outstanding quantity',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        const excessiveQuantity =
          orderedQuantity + 1

        const response = await request.post(
          '/api/v1/goods-receipts',
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              purchase_order_id:
                approvedPurchaseOrder.purchase_order_id,
              received_by_user_id:
                session.userId,
              delivery_reference:
                `OVER-RECEIPT-${Date.now()}`,
              notes:
                'This over-receipt must be rejected',
              items: [
                {
                  purchase_order_item_id:
                    purchaseOrderItem.purchase_order_item_id,
                  item_code:
                    purchaseOrderItem.item_code,
                  description:
                    purchaseOrderItem.description,
                  ordered_quantity:
                    orderedQuantity,
                  received_quantity:
                    excessiveQuantity,
                  rejected_quantity: 0,
                  unit_of_measure:
                    purchaseOrderItem.unit_of_measure,
                  notes:
                    'Quantity exceeds the outstanding amount',
                },
              ],
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(400)

        expect(
          responseBody.detail,
        ).toContain(
          'received plus rejected quantity cannot exceed outstanding quantity',
        )

        // Confirm that the failed transaction did not
        // change the Purchase Order status.
        const purchaseOrderResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        expect(
          purchaseOrderResponse.status(),
        ).toBe(200)

        const unchangedPurchaseOrder =
          (await purchaseOrderResponse.json()) as PurchaseOrderResponse

        expect(
          unchangedPurchaseOrder.status,
        ).toBe('APPROVED')
      },
    )


        test(
      'GR-REQ-009 - receipt with zero received and rejected quantities is rejected',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        const response = await request.post(
          '/api/v1/goods-receipts',
          {
            headers:
              getAuthorizationHeaders(
                session.accessToken,
              ),
            data: {
              purchase_order_id:
                approvedPurchaseOrder.purchase_order_id,
              received_by_user_id:
                session.userId,
              delivery_reference:
                `ZERO-QTY-${Date.now()}`,
              notes:
                'Zero-quantity receipt must be rejected',
              items: [
                {
                  purchase_order_item_id:
                    purchaseOrderItem.purchase_order_item_id,
                  item_code:
                    purchaseOrderItem.item_code,
                  description:
                    purchaseOrderItem.description,
                  ordered_quantity:
                    orderedQuantity,
                  received_quantity: 0,
                  rejected_quantity: 0,
                  unit_of_measure:
                    purchaseOrderItem.unit_of_measure,
                  notes:
                    'No quantity entered',
                },
              ],
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          `Unexpected response: ${JSON.stringify(responseBody)}`,
        ).toBe(400)

        expect(responseBody.detail).toBe(
          'Enter a received or rejected quantity for at least one item.',
        )

        // Confirm the failed receipt did not
        // change the Purchase Order.
        const purchaseOrderResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        expect(
          purchaseOrderResponse.status(),
        ).toBe(200)

        const unchangedPurchaseOrder =
          (await purchaseOrderResponse.json()) as PurchaseOrderResponse

        expect(
          unchangedPurchaseOrder.status,
        ).toBe('APPROVED')
      },
    )

        test(
      'GR-REQ-010 - fully received purchase order cannot be received again',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        const headers =
          getAuthorizationHeaders(
            session.accessToken,
          )

        // Step 1: Receive the complete ordered quantity.
        const firstReceiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers,
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `FULL-${Date.now()}`,
                notes:
                  'Complete receipt',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      orderedQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Complete quantity received',
                  },
                ],
              },
            },
          )

        const firstReceiptBody =
          await firstReceiptResponse.json()

        expect(
          firstReceiptResponse.status(),
          `First receipt failed: ${JSON.stringify(firstReceiptBody)}`,
        ).toBe(201)

        // Step 2: Confirm the PO is fully received.
        const receivedPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers,
            },
          )

        expect(
          receivedPoResponse.status(),
        ).toBe(200)

        const receivedPurchaseOrder =
          (await receivedPoResponse.json()) as PurchaseOrderResponse

        expect(
          receivedPurchaseOrder.status,
        ).toBe('RECEIVED')

        // Step 3: Try receiving against the completed PO again.
        const secondReceiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers,
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `DUPLICATE-${Date.now()}`,
                notes:
                  'This receipt must be rejected',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity: 1,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Duplicate receiving attempt',
                  },
                ],
              },
            },
          )

        const secondReceiptBody =
          await secondReceiptResponse.json()

        expect(
          secondReceiptResponse.status(),
          `Unexpected second receipt response: ${JSON.stringify(secondReceiptBody)}`,
        ).toBe(400)

        expect(secondReceiptBody.detail).toBe(
          'Goods can only be received against an APPROVED or PARTIALLY_RECEIVED purchase order.',
        )

        // Step 4: Confirm the PO remains RECEIVED.
        const finalPoResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers,
            },
          )

        expect(finalPoResponse.status()).toBe(200)

        const finalPurchaseOrder =
          (await finalPoResponse.json()) as PurchaseOrderResponse

        expect(
          finalPurchaseOrder.status,
        ).toBe('RECEIVED')
      },
    )

    test(
      'DB-REQ-002 - goods receipt updates inventory balance and creates transaction',
      async ({ request }) => {
        const session =
          await getAdminSession(request)

        const approvedPurchaseOrder =
          await createApprovedPurchaseOrder(
            request,
            session,
          )

        const purchaseOrderItem =
          approvedPurchaseOrder.items[0]

        if (!purchaseOrderItem.item_code) {
          throw new Error(
            'The Purchase Order item must have a catalogue item code',
          )
        }

        const orderedQuantity =
          Number(purchaseOrderItem.quantity)

        // Data-layer baseline before receiving the goods.
        const catalogueRows =
          await queryDatabase<CatalogueItemDatabaseRow>(
            `
              SELECT
                catalogue_item_id::text
                  AS catalogue_item_id
              FROM procurement.catalogue_items
              WHERE item_code = $1
            `,
            [purchaseOrderItem.item_code],
          )

        expect(catalogueRows).toHaveLength(1)

        const catalogueItemId =
          Number(
            catalogueRows[0].catalogue_item_id,
          )

        const balanceBeforeRows =
          await queryDatabase<InventoryBalanceDatabaseRow>(
            `
              SELECT
                COALESCE(
                  (
                    SELECT on_hand_quantity
                    FROM procurement.inventory_balances
                    WHERE catalogue_item_id = $1
                  ),
                  0
                )::text AS on_hand_quantity,
                COALESCE(
                  (
                    SELECT available_quantity
                    FROM procurement.inventory_balances
                    WHERE catalogue_item_id = $1
                  ),
                  0
                )::text AS available_quantity,
                COALESCE(
                  (
                    SELECT quarantine_quantity
                    FROM procurement.inventory_balances
                    WHERE catalogue_item_id = $1
                  ),
                  0
                )::text AS quarantine_quantity
            `,
            [catalogueItemId],
          )

        expect(balanceBeforeRows).toHaveLength(1)

        const balanceBefore =
          balanceBeforeRows[0]

        // API action: create a full Goods Receipt.
        const receiptResponse =
          await request.post(
            '/api/v1/goods-receipts',
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
              data: {
                purchase_order_id:
                  approvedPurchaseOrder.purchase_order_id,
                received_by_user_id:
                  session.userId,
                delivery_reference:
                  `DB-CHECK-${Date.now()}`,
                notes:
                  'API and database validation',
                items: [
                  {
                    purchase_order_item_id:
                      purchaseOrderItem.purchase_order_item_id,
                    item_code:
                      purchaseOrderItem.item_code,
                    description:
                      purchaseOrderItem.description,
                    ordered_quantity:
                      orderedQuantity,
                    received_quantity:
                      orderedQuantity,
                    rejected_quantity: 0,
                    unit_of_measure:
                      purchaseOrderItem.unit_of_measure,
                    notes:
                      'Inventory database validation',
                  },
                ],
              },
            },
          )

        const receiptBody =
          await receiptResponse.json()

        expect(
          receiptResponse.status(),
          `Goods Receipt creation failed: ${JSON.stringify(receiptBody)}`,
        ).toBe(201)

        const createdReceipt =
          receiptBody as GoodsReceiptResponse

        expect(createdReceipt.items).toHaveLength(1)

        const createdReceiptItem =
          createdReceipt.items[0]

        // Data-layer check 1: one inventory transaction was created.
        const transactionRows =
          await queryDatabase<InventoryTransactionDatabaseRow>(
            `
              SELECT
                catalogue_item_id::text,
                transaction_type,
                quantity::text,
                unit_of_measure,
                source_document_type,
                source_document_id::text,
                source_line_id::text,
                reference_number,
                created_by_user_id::text
              FROM procurement.inventory_transactions
              WHERE source_document_type = 'GOODS_RECEIPT'
                AND source_document_id = $1
                AND source_line_id = $2
                AND transaction_type = 'RECEIPT'
            `,
            [
              createdReceipt.goods_receipt_id,
              createdReceiptItem.goods_receipt_item_id,
            ],
          )

        expect(transactionRows).toHaveLength(1)

        const inventoryTransaction =
          transactionRows[0]

        expect(
          Number(
            inventoryTransaction.catalogue_item_id,
          ),
        ).toBe(catalogueItemId)

        expect(
          inventoryTransaction.transaction_type,
        ).toBe('RECEIPT')

        expect(
          Number(inventoryTransaction.quantity),
        ).toBeCloseTo(orderedQuantity, 2)

        expect(
          inventoryTransaction.unit_of_measure,
        ).toBe(
          purchaseOrderItem.unit_of_measure.toUpperCase(),
        )

        expect(
          inventoryTransaction.source_document_type,
        ).toBe('GOODS_RECEIPT')

        expect(
          Number(
            inventoryTransaction.source_document_id,
          ),
        ).toBe(createdReceipt.goods_receipt_id)

        expect(
          Number(
            inventoryTransaction.source_line_id,
          ),
        ).toBe(
          createdReceiptItem.goods_receipt_item_id,
        )

        expect(
          inventoryTransaction.reference_number,
        ).toBe(createdReceipt.receipt_number)

        expect(
          Number(
            inventoryTransaction.created_by_user_id,
          ),
        ).toBe(session.userId)

        // Data-layer check 2: the inventory balance increased.
        const balanceAfterRows =
          await queryDatabase<InventoryBalanceDatabaseRow>(
            `
              SELECT
                on_hand_quantity::text,
                available_quantity::text,
                quarantine_quantity::text
              FROM procurement.inventory_balances
              WHERE catalogue_item_id = $1
            `,
            [catalogueItemId],
          )

        expect(balanceAfterRows).toHaveLength(1)

        const balanceAfter = balanceAfterRows[0]

        expect(
          Number(balanceAfter.on_hand_quantity),
        ).toBeCloseTo(
          Number(balanceBefore.on_hand_quantity) +
            orderedQuantity,
          2,
        )

        expect(
          Number(balanceAfter.available_quantity),
        ).toBeCloseTo(
          Number(
            balanceBefore.available_quantity,
          ) + orderedQuantity,
          2,
        )

        expect(
          Number(balanceAfter.quarantine_quantity),
        ).toBeCloseTo(
          Number(
            balanceBefore.quarantine_quantity,
          ),
          2,
        )

        // API cross-check: the linked PO is fully received.
        const purchaseOrderResponse =
          await request.get(
            `/api/v1/purchase-orders/${approvedPurchaseOrder.purchase_order_id}`,
            {
              headers:
                getAuthorizationHeaders(
                  session.accessToken,
                ),
            },
          )

        expect(
          purchaseOrderResponse.status(),
        ).toBe(200)

        const receivedPurchaseOrder =
          (await purchaseOrderResponse.json()) as PurchaseOrderResponse

        expect(
          receivedPurchaseOrder.status,
        ).toBe('RECEIVED')
      },
    )
  },
)
