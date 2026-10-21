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

type PurchaseRequestItemResponse = {
  purchase_request_item_id: number
  purchase_request_id: number
  item_code: string | null
  description: string
  quantity: number
  unit_of_measure: string
  estimated_unit_price: number
  estimated_total: number
  notes: string | null
}

type PurchaseRequestResponse = {
  purchase_request_id: number
  request_number: string
  requested_by_user_id: number
  department: string
  purpose: string
  priority: string
  status: string
  total_estimated_amount: number
  required_by_date: string | null
  created_at: string
  updated_at: string
  items: PurchaseRequestItemResponse[]
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
    JSON.stringify(loginBody),
  ).toBe(200)

  expect(loginBody.access_token).toBeTruthy()
  expect(loginBody.token_type).toBe('bearer')

  expect(
    loginBody.user.user_id,
  ).toBeGreaterThan(0)

  return {
    accessToken:
      loginBody.access_token,
    userId:
      loginBody.user.user_id,
  }
}

test.describe(
  'NEXORA Purchase Request API',
  () => {
    test(
      'PR-REQ-004 - authenticated user can retrieve purchase requests',
      async ({ request }) => {
        const { accessToken } =
          await getAdminSession(request)

        const response = await request.get(
          '/api/v1/purchase-requests',
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
      'SEC-REQ-002 - unauthenticated purchase request access is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/purchase-requests',
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
      'SEC-REQ-002 - invalid purchase request access token is rejected',
      async ({ request }) => {
        const response = await request.get(
          '/api/v1/purchase-requests',
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
      'PR-REQ-001 - authenticated user can create a purchase request',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const requiredByDate =
          new Date(
            Date.now() +
              7 * 24 * 60 * 60 * 1000,
          ).toISOString()

        const purchaseRequestData = {
          requested_by_user_id: userId,
          department: 'Quality Engineering',
          purpose:
            `NEXORA API automation ${uniqueValue}`,
          priority: 'NORMAL',
          required_by_date:
            requiredByDate,
          items: [
            {
              item_code:
                `ITEM-${uniqueValue}`,
              description:
                'NEXORA API automation test item',
              quantity: 5,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 12.5,
              notes:
                'Created by Playwright API automation',
            },
          ],
        }

        const response =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseRequestData,
            },
          )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          JSON.stringify(responseBody),
        ).toBe(201)

        const createdRequest =
          responseBody as PurchaseRequestResponse

        expect(
          createdRequest.purchase_request_id,
        ).toBeGreaterThan(0)

        expect(
          createdRequest.request_number,
        ).toBeTruthy()

        expect(
          createdRequest.requested_by_user_id,
        ).toBe(userId)

        expect(
          createdRequest.department,
        ).toBe(
          purchaseRequestData.department,
        )

        expect(
          createdRequest.purpose,
        ).toBe(
          purchaseRequestData.purpose,
        )

        expect(
          createdRequest.priority,
        ).toBe(
          purchaseRequestData.priority,
        )

        expect(
          createdRequest.status,
        ).toBe('DRAFT')

        expect(
          createdRequest.total_estimated_amount,
        ).toBe(62.5)

        expect(
          createdRequest.items,
        ).toHaveLength(1)

        expect(
          createdRequest.items[0].item_code,
        ).toBe(
          purchaseRequestData.items[0].item_code,
        )

        expect(
          createdRequest.items[0].description,
        ).toBe(
          purchaseRequestData.items[0].description,
        )

        expect(
          createdRequest.items[0].quantity,
        ).toBe(5)

        expect(
          createdRequest.items[0].estimated_unit_price,
        ).toBe(12.5)

        expect(
          createdRequest.items[0].estimated_total,
        ).toBe(62.5)

        expect(
          createdRequest.created_at,
        ).toBeTruthy()

        expect(
          createdRequest.updated_at,
        ).toBeTruthy()
      },
    )
      test(
      'PR-REQ-004 - authenticated user can retrieve a purchase request by ID',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const purchaseRequestData = {
          requested_by_user_id: userId,
          department: 'Procurement',
          purpose:
            `Retrieve purchase request test ${uniqueValue}`,
          priority: 'HIGH',
          required_by_date:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          items: [
            {
              item_code:
                `GET-${uniqueValue}`,
              description:
                'Purchase request retrieval test item',
              quantity: 4,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 25,
              notes:
                'Created for GET-by-ID validation',
            },
          ],
        }

        // Create the Purchase Request.
        const createResponse =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseRequestData,
            },
          )

        const createBody =
          await createResponse.json()

        expect(
          createResponse.status(),
          JSON.stringify(createBody),
        ).toBe(201)

        const createdRequest =
          createBody as PurchaseRequestResponse

        expect(
          createdRequest.purchase_request_id,
        ).toBeGreaterThan(0)

        expect(
          createdRequest.request_number,
        ).toBeTruthy()

        // Retrieve it using the generated ID.
        const getResponse =
          await request.get(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
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

        const retrievedRequest =
          getBody as PurchaseRequestResponse

        expect(
          retrievedRequest.purchase_request_id,
        ).toBe(
          createdRequest.purchase_request_id,
        )

        expect(
          retrievedRequest.request_number,
        ).toBe(
          createdRequest.request_number,
        )

        expect(
          retrievedRequest.requested_by_user_id,
        ).toBe(userId)

        expect(
          retrievedRequest.department,
        ).toBe(
          purchaseRequestData.department,
        )

        expect(
          retrievedRequest.purpose,
        ).toBe(
          purchaseRequestData.purpose,
        )

        expect(
          retrievedRequest.priority,
        ).toBe(
          purchaseRequestData.priority,
        )

        expect(
          retrievedRequest.status,
        ).toBe('DRAFT')

        expect(
          retrievedRequest.total_estimated_amount,
        ).toBe(100)

        expect(
          retrievedRequest.items,
        ).toHaveLength(1)

        expect(
          retrievedRequest.items[0].item_code,
        ).toBe(
          purchaseRequestData.items[0].item_code,
        )

        expect(
          retrievedRequest.items[0].quantity,
        ).toBe(4)

        expect(
          retrievedRequest.items[0].estimated_unit_price,
        ).toBe(25)

        expect(
          retrievedRequest.items[0].estimated_total,
        ).toBe(100)
      },
    )

    test(
      'PR-REQ-002 - authenticated user can update a draft purchase request',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const originalData = {
          requested_by_user_id: userId,
          department: 'Procurement',
          purpose:
            `Original PR purpose ${uniqueValue}`,
          priority: 'NORMAL',
          required_by_date:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          items: [
            {
              item_code:
                `UPD-${uniqueValue}`,
              description:
                'Purchase request update test item',
              quantity: 3,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 20,
              notes:
                'Original item information',
            },
          ],
        }

        // Step 1: Create a Draft Purchase Request.
        const createResponse =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: originalData,
            },
          )

        const createBody =
          await createResponse.json()

        expect(
          createResponse.status(),
          JSON.stringify(createBody),
        ).toBe(201)

        const createdRequest =
          createBody as PurchaseRequestResponse

        expect(
          createdRequest.status,
        ).toBe('DRAFT')

        // Step 2: Update editable header information.
        const updatedData = {
          department:
            'Quality Engineering',
          purpose:
            `Updated PR purpose ${uniqueValue}`,
          priority:
            'HIGH',
          required_by_date:
            new Date(
              Date.now() +
                14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
        }

        const updateResponse =
          await request.patch(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: updatedData,
            },
          )

        const updateBody =
          await updateResponse.json()

        expect(
          updateResponse.status(),
          JSON.stringify(updateBody),
        ).toBe(200)

        const updatedRequest =
          updateBody as PurchaseRequestResponse

        expect(
          updatedRequest.purchase_request_id,
        ).toBe(
          createdRequest.purchase_request_id,
        )

        expect(
          updatedRequest.request_number,
        ).toBe(
          createdRequest.request_number,
        )

        expect(
          updatedRequest.department,
        ).toBe(updatedData.department)

        expect(
          updatedRequest.purpose,
        ).toBe(updatedData.purpose)

        expect(
          updatedRequest.priority,
        ).toBe(updatedData.priority)

        expect(
          updatedRequest.status,
        ).toBe('DRAFT')

        // The item was not changed by the header update.
        expect(
          updatedRequest.items,
        ).toHaveLength(1)

        expect(
          updatedRequest.total_estimated_amount,
        ).toBe(60)

        // Step 3: Retrieve the PR to confirm persistence.
        const getResponse =
          await request.get(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
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

        const retrievedRequest =
          getBody as PurchaseRequestResponse

        expect(
          retrievedRequest.department,
        ).toBe(updatedData.department)

        expect(
          retrievedRequest.purpose,
        ).toBe(updatedData.purpose)

        expect(
          retrievedRequest.priority,
        ).toBe(updatedData.priority)

        expect(
          retrievedRequest.status,
        ).toBe('DRAFT')

        expect(
          retrievedRequest.total_estimated_amount,
        ).toBe(60)
      },
    )
    test(
      'PR-REQ-003 - authenticated user can submit a draft purchase request',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const purchaseRequestData = {
          requested_by_user_id: userId,
          department: 'Procurement',
          purpose:
            `PR submission test ${uniqueValue}`,
          priority: 'HIGH',
          required_by_date:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          items: [
            {
              item_code:
                `SUB-${uniqueValue}`,
              description:
                'Purchase request submission item',
              quantity: 2,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 50,
              notes:
                'Created for status-transition testing',
            },
          ],
        }

        // Step 1: Create the Purchase Request.
        const createResponse =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseRequestData,
            },
          )

        const createBody =
          await createResponse.json()

        expect(
          createResponse.status(),
          JSON.stringify(createBody),
        ).toBe(201)

        const createdRequest =
          createBody as PurchaseRequestResponse

        expect(
          createdRequest.status,
        ).toBe('DRAFT')

        expect(
          createdRequest.total_estimated_amount,
        ).toBe(100)

        // Step 2: Submit the Draft Purchase Request.
        const submitResponse =
          await request.patch(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: {
                status: 'SUBMITTED',
              },
            },
          )

        const submitBody =
          await submitResponse.json()

        expect(
          submitResponse.status(),
          JSON.stringify(submitBody),
        ).toBe(200)

        const submittedRequest =
          submitBody as PurchaseRequestResponse

        expect(
          submittedRequest.purchase_request_id,
        ).toBe(
          createdRequest.purchase_request_id,
        )

        expect(
          submittedRequest.request_number,
        ).toBe(
          createdRequest.request_number,
        )

        expect(
          submittedRequest.status,
        ).toBe('SUBMITTED')

        // Step 3: Retrieve it to confirm persistence.
        const getResponse =
          await request.get(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
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

        const retrievedRequest =
          getBody as PurchaseRequestResponse

        expect(
          retrievedRequest.status,
        ).toBe('SUBMITTED')

        expect(
          retrievedRequest.total_estimated_amount,
        ).toBe(100)

        expect(
          retrievedRequest.items,
        ).toHaveLength(1)
      },
    )
    test(
      'PR-REQ-001 - zero item quantity is rejected',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const invalidRequestData = {
          requested_by_user_id: userId,
          department: 'Procurement',
          purpose:
            `Invalid quantity test ${uniqueValue}`,
          priority: 'NORMAL',
          required_by_date:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          items: [
            {
              item_code:
                `ZERO-${uniqueValue}`,
              description:
                'Item with an invalid zero quantity',
              quantity: 0,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 25,
              notes:
                'This request must be rejected',
            },
          ],
        }

        const response =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: invalidRequestData,
            },
          )

        const responseBody =
          await response.json()

        expect(
          response.status(),
          JSON.stringify(responseBody),
        ).toBe(422)

        expect(
          Array.isArray(responseBody.detail),
        ).toBe(true)

        const quantityError =
          responseBody.detail.some(
            (
              validationError: {
                loc: Array<string | number>
              },
            ) =>
              validationError.loc.includes(
                'quantity',
              ),
          )

        expect(quantityError).toBe(true)
      },
    )
    test(
      'PR-REQ-003 - authenticated user can cancel a draft purchase request',
      async ({ request }) => {
        const {
          accessToken,
          userId,
        } = await getAdminSession(request)

        const uniqueValue = Date.now()

        const purchaseRequestData = {
          requested_by_user_id: userId,
          department: 'Procurement',
          purpose:
            `PR cancellation test ${uniqueValue}`,
          priority: 'NORMAL',
          required_by_date:
            new Date(
              Date.now() +
                7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          items: [
            {
              item_code:
                `CAN-${uniqueValue}`,
              description:
                'Purchase request cancellation item',
              quantity: 2,
              unit_of_measure: 'UNIT',
              estimated_unit_price: 30,
              notes:
                'Created for cancellation testing',
            },
          ],
        }

        // Step 1: Create a Draft Purchase Request.
        const createResponse =
          await request.post(
            '/api/v1/purchase-requests',
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: purchaseRequestData,
            },
          )

        const createBody =
          await createResponse.json()

        expect(
          createResponse.status(),
          JSON.stringify(createBody),
        ).toBe(201)

        const createdRequest =
          createBody as PurchaseRequestResponse

        expect(
          createdRequest.status,
        ).toBe('DRAFT')

        // Step 2: Cancel the Draft Purchase Request.
        const cancelResponse =
          await request.patch(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
              data: {
                status: 'CANCELLED',
              },
            },
          )

        const cancelBody =
          await cancelResponse.json()

        expect(
          cancelResponse.status(),
          JSON.stringify(cancelBody),
        ).toBe(200)

        const cancelledRequest =
          cancelBody as PurchaseRequestResponse

        expect(
          cancelledRequest.purchase_request_id,
        ).toBe(
          createdRequest.purchase_request_id,
        )

        expect(
          cancelledRequest.request_number,
        ).toBe(
          createdRequest.request_number,
        )

        expect(
          cancelledRequest.status,
        ).toBe('CANCELLED')

        // Step 3: Retrieve it to verify persistence.
        const getResponse =
          await request.get(
            `/api/v1/purchase-requests/${createdRequest.purchase_request_id}`,
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

        const retrievedRequest =
          getBody as PurchaseRequestResponse

        expect(
          retrievedRequest.status,
        ).toBe('CANCELLED')

        expect(
          retrievedRequest.total_estimated_amount,
        ).toBe(60)

        expect(
          retrievedRequest.items,
        ).toHaveLength(1)
      },
    )


},
)