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
  supplier_code: string
  supplier_name: string
  is_active: boolean
}

type CatalogueItemResponse = {
  catalogue_item_id: number
  item_code: string
  item_name: string
  item_type: string
  purchase_uom_id: number
  status: string
}

type SupplierItemResponse = {
  supplier_item_id: number
  supplier_id: number
  catalogue_item_id: number
  purchase_uom_id: number
  unit_price: number | string
  currency_code: string
  minimum_order_quantity: number | string | null
  effective_from: string
  effective_to: string | null
  active: boolean
}

type UnitOfMeasureResponse = {
  uom_id: number
  uom_code: string
  uom_name: string
  active: boolean
}

type TaxCodeResponse = {
  tax_code_id: number
  tax_code: string
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
  unit_price: number
  tax_code_id: number | null
  tax_rate: number
  tax_amount: number
  line_total: number
  notes: string | null
}

type PurchaseOrderResponse = {
  purchase_order_id: number
  po_number: string
  supplier_id: number
  purchase_request_id: number | null
  created_by_user_id: number
  warehouse_id: number | null
  receiving_location_id: number | null
  status: string
  currency: string
  subtotal: number
  tax_amount: number
  total_amount: number
  base_currency: string
  exchange_rate: number
  base_subtotal: number | null
  base_tax_amount: number | null
  base_total_amount: number | null
  delivery_address: string | null
  notes: string | null
  expected_delivery_date: string | null
  created_at: string
  updated_at: string
  items: PurchaseOrderItemResponse[]
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

  const loginResponse = await request.post(
    '/api/v1/auth/login',
    {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    },
  )

  const loginBody =
    (await loginResponse.json()) as LoginResponse

  expect(
    loginResponse.status(),
    'Administrator login should return HTTP 200',
  ).toBe(200)

  expect(loginBody.access_token).toBeTruthy()
  expect(loginBody.token_type).toBe('bearer')
  expect(loginBody.user.user_id).toBeGreaterThan(0)

  return {
    accessToken: loginBody.access_token,
    userId: loginBody.user.user_id,
  }
}

async function getPurchasingSetup(
  request: APIRequestContext,
  accessToken: string,
): Promise<PurchasingSetup> {
  const authorizationHeaders = {
    Authorization: `Bearer ${accessToken}`,
  }

  const suppliersResponse = await request.get(
    '/api/v1/suppliers',
    {
      headers: authorizationHeaders,
    },
  )

  const suppliersBody =
    await suppliersResponse.json()

  expect(
    suppliersResponse.status(),
    JSON.stringify(suppliersBody),
  ).toBe(200)

  const activeSuppliers =
    (suppliersBody as SupplierResponse[]).filter(
      (supplier) => supplier.is_active,
    )

  expect(
    activeSuppliers.length,
    'At least one active supplier is required',
  ).toBeGreaterThan(0)

  const catalogueResponse = await request.get(
    '/api/v1/catalogue/items',
    {
      headers: authorizationHeaders,
    },
  )

  const catalogueBody =
    await catalogueResponse.json()

  expect(
    catalogueResponse.status(),
    JSON.stringify(catalogueBody),
  ).toBe(200)

  const activeCatalogueItems =
    (
      catalogueBody as CatalogueItemResponse[]
    ).filter(
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
      headers: authorizationHeaders,
    },
  )

  const uomsBody =
    await uomsResponse.json()

  expect(
    uomsResponse.status(),
    JSON.stringify(uomsBody),
  ).toBe(200)

  const unitsOfMeasure =
    uomsBody as UnitOfMeasureResponse[]

  const taxCodesResponse = await request.get(
    '/api/v1/reference/tax-codes',
    {
      headers: authorizationHeaders,
    },
  )

  const taxCodesBody =
    await taxCodesResponse.json()

  expect(
    taxCodesResponse.status(),
    JSON.stringify(taxCodesBody),
  ).toBe(200)

  const activeTaxCodes =
    (taxCodesBody as TaxCodeResponse[]).filter(
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

  const today = new Date()
    .toISOString()
    .slice(0, 10)

  for (
    const catalogueItem
    of activeCatalogueItems
  ) {
    const supplierItemsResponse =
      await request.get(
        `/api/v1/catalogue/items/${catalogueItem.catalogue_item_id}/suppliers`,
        {
          headers: authorizationHeaders,
        },
      )

    if (
      supplierItemsResponse.status() !== 200
    ) {
      continue
    }

    const supplierItemsBody =
      await supplierItemsResponse.json()

    const supplierItems =
      supplierItemsBody as SupplierItemResponse[]

    const validSupplierItem =
      supplierItems.find(
        (supplierItem) => {
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
        },
      )

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

test.describe(
  'NEXORA Purchase Order API',
  () => {
    test(
      'PO-REQ-004 - authenticated user can retrieve purchase orders',
      async ({ request }) => {
        const { accessToken } =
          await getAdminSession(request)

        const response = await request.get(
          '/api/v1/purchase-orders',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          JSON.stringify(responseBody),
        ).toBe(200)

        expect(
          Array.isArray(responseBody),
        ).toBe(true)
      },
    )

    test(
      'SEC-REQ-002 - unauthenticated purchase order access is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/purchase-orders',
        )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          JSON.stringify(responseBody),
        ).toBe(401)

        expect(responseBody.detail).toBe(
          'Invalid or missing authentication token',
        )
      },
    )

    test(
      'SEC-REQ-002 - invalid purchase order access token is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/purchase-orders',
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
          JSON.stringify(responseBody),
        ).toBe(401)

        expect(responseBody.detail).toBe(
          'Invalid or missing authentication token',
        )
      },
    )

    test(
      'PO-REQ-001 - authenticated user can create an AUD purchase order',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const purchasingSetup =
          await getPurchasingSetup(
            request,
            accessToken,
          )

        const {
          supplier,
          catalogueItem,
          supplierItem,
          unitOfMeasure,
          taxCode,
        } = purchasingSetup

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

        const expectedUnitPrice =
          Number(supplierItem.unit_price)

        const expectedTaxRate =
          Number(taxCode.tax_rate)

        const expectedSubtotal =
          quantity * expectedUnitPrice

        const expectedTaxAmount =
          Math.round(
            expectedSubtotal *
              (expectedTaxRate / 100) *
              100,
          ) / 100

        const expectedTotal =
          Math.round(
            (
              expectedSubtotal +
              expectedTaxAmount
            ) * 100,
          ) / 100

        const uniqueValue = Date.now()

        const purchaseOrderData = {
          supplier_id: supplier.supplier_id,
          purchase_request_id: null,
          created_by_user_id: userId,
          warehouse_id: null,
          receiving_location_id: null,
          currency: 'AUD',
          delivery_address:
            'NEXORA Melbourne Warehouse',
          notes:
            `Created by PO API test ${uniqueValue}`,
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
                expectedUnitPrice,
              tax_code_id:
                taxCode.tax_code_id,
              notes:
                'Created by Playwright API automation',
            },
          ],
        }

        const response =
          await request.post(
            '/api/v1/purchase-orders',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseOrderData,
            },
          )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          JSON.stringify(responseBody),
        ).toBe(201)

        const createdOrder =
          responseBody as PurchaseOrderResponse

        expect(
          createdOrder.purchase_order_id,
        ).toBeGreaterThan(0)

        expect(createdOrder.po_number).toBeTruthy()

        expect(createdOrder.supplier_id).toBe(
          supplier.supplier_id,
        )

        expect(
          createdOrder.created_by_user_id,
        ).toBe(userId)

        expect(
          createdOrder.purchase_request_id,
        ).toBeNull()

        expect(createdOrder.status).toBe('DRAFT')
        expect(createdOrder.currency).toBe('AUD')

        expect(
          createdOrder.base_currency,
        ).toBe('AUD')

        expect(
          Number(createdOrder.exchange_rate),
        ).toBeCloseTo(1, 6)

        expect(
          Number(createdOrder.subtotal),
        ).toBeCloseTo(expectedSubtotal, 2)

        expect(
          Number(createdOrder.tax_amount),
        ).toBeCloseTo(expectedTaxAmount, 2)

        expect(
          Number(createdOrder.total_amount),
        ).toBeCloseTo(expectedTotal, 2)

        expect(
          Number(createdOrder.base_subtotal),
        ).toBeCloseTo(expectedSubtotal, 2)

        expect(
          Number(createdOrder.base_tax_amount),
        ).toBeCloseTo(expectedTaxAmount, 2)

        expect(
          Number(createdOrder.base_total_amount),
        ).toBeCloseTo(expectedTotal, 2)

        expect(createdOrder.items).toHaveLength(1)

        const createdItem =
          createdOrder.items[0]

        expect(createdItem.item_code).toBe(
          catalogueItem.item_code,
        )

        expect(
          Number(createdItem.quantity),
        ).toBeCloseTo(quantity, 2)

        expect(
          createdItem.unit_of_measure,
        ).toBe(unitOfMeasure.uom_code)

        expect(
          Number(createdItem.unit_price),
        ).toBeCloseTo(expectedUnitPrice, 2)

        expect(createdItem.tax_code_id).toBe(
          taxCode.tax_code_id,
        )

        expect(
          Number(createdItem.tax_rate),
        ).toBeCloseTo(expectedTaxRate, 2)

        expect(
          Number(createdItem.tax_amount),
        ).toBeCloseTo(expectedTaxAmount, 2)

        expect(
          Number(createdItem.line_total),
        ).toBeCloseTo(expectedTotal, 2)

        expect(
          createdOrder.delivery_address,
        ).toBe(
          purchaseOrderData.delivery_address,
        )

        expect(createdOrder.created_at).toBeTruthy()
        expect(createdOrder.updated_at).toBeTruthy()
      },
    )
  
    test(
      'PO-REQ-004 - authenticated user can retrieve a purchase order by ID',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const purchasingSetup =
          await getPurchasingSetup(
            request,
            accessToken,
          )

        const {
          supplier,
          catalogueItem,
          supplierItem,
          unitOfMeasure,
          taxCode,
        } = purchasingSetup

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

        const expectedUnitPrice =
          Number(supplierItem.unit_price)

        const expectedTaxRate =
          Number(taxCode.tax_rate)

        const expectedSubtotal =
          quantity * expectedUnitPrice

        const expectedTaxAmount =
          Math.round(
            expectedSubtotal *
              (expectedTaxRate / 100) *
              100,
          ) / 100

        const expectedTotal =
          Math.round(
            (
              expectedSubtotal +
              expectedTaxAmount
            ) * 100,
          ) / 100

        const uniqueValue = Date.now()

        const purchaseOrderData = {
          supplier_id:
            supplier.supplier_id,
          purchase_request_id: null,
          created_by_user_id: userId,
          warehouse_id: null,
          receiving_location_id: null,
          currency: 'AUD',
          delivery_address:
            'NEXORA Retrieval Warehouse',
          notes:
            `PO retrieval test ${uniqueValue}`,
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
                expectedUnitPrice,
              tax_code_id:
                taxCode.tax_code_id,
              notes:
                'Created for PO retrieval testing',
            },
          ],
        }

        // Create the Purchase Order.
        const createResponse =
          await request.post(
            '/api/v1/purchase-orders',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseOrderData,
            },
          )

        const createBody =
          await createResponse.json()

        expect(
          createResponse.status(),
          JSON.stringify(createBody),
        ).toBe(201)

        const createdOrder =
          createBody as PurchaseOrderResponse

        expect(
          createdOrder.purchase_order_id,
        ).toBeGreaterThan(0)

        // Retrieve it using the generated ID.
        const getResponse =
          await request.get(
            `/api/v1/purchase-orders/${createdOrder.purchase_order_id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            },
          )

        const getBody =
          await getResponse.json()

        expect(
          getResponse.status(),
          JSON.stringify(getBody),
        ).toBe(200)

        const retrievedOrder =
          getBody as PurchaseOrderResponse

        expect(
          retrievedOrder.purchase_order_id,
        ).toBe(
          createdOrder.purchase_order_id,
        )

        expect(
          retrievedOrder.po_number,
        ).toBe(createdOrder.po_number)

        expect(
          retrievedOrder.supplier_id,
        ).toBe(supplier.supplier_id)

        expect(
          retrievedOrder.created_by_user_id,
        ).toBe(userId)

        expect(
          retrievedOrder.status,
        ).toBe('DRAFT')

        expect(
          retrievedOrder.currency,
        ).toBe('AUD')

        expect(
          Number(retrievedOrder.exchange_rate),
        ).toBeCloseTo(1, 6)

        expect(
          Number(retrievedOrder.subtotal),
        ).toBeCloseTo(
          expectedSubtotal,
          2,
        )

        expect(
          Number(retrievedOrder.tax_amount),
        ).toBeCloseTo(
          expectedTaxAmount,
          2,
        )

        expect(
          Number(retrievedOrder.total_amount),
        ).toBeCloseTo(
          expectedTotal,
          2,
        )

        expect(
          retrievedOrder.items,
        ).toHaveLength(1)

        expect(
          retrievedOrder.items[0].item_code,
        ).toBe(
          catalogueItem.item_code,
        )

        expect(
          Number(
            retrievedOrder.items[0].unit_price,
          ),
        ).toBeCloseTo(
          expectedUnitPrice,
          2,
        )

        expect(
          Number(
            retrievedOrder.items[0].tax_rate,
          ),
        ).toBeCloseTo(
          expectedTaxRate,
          2,
        )

        expect(
          Number(
            retrievedOrder.items[0].line_total,
          ),
        ).toBeCloseTo(
          expectedTotal,
          2,
        )
      },
    )


},
)