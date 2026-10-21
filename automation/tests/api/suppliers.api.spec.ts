import {
  expect,
  test,
  type APIRequestContext,
} from '@playwright/test'

type LoginResponse = {
  access_token: string
  token_type: string
}

type SupplierResponse = {
  supplier_id: number
  supplier_code: string
  supplier_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

async function getAdminAccessToken(
  request: APIRequestContext,
): Promise<string> {
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

  return loginBody.access_token
}

test.describe('NEXORA Supplier API', () => {
  test(
    'SUP-REQ-004 - authenticated user can retrieve suppliers',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const response = await request.get(
        '/api/v1/suppliers',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
    'SEC-REQ-002 - unauthenticated supplier access is rejected',
    async ({ request }) => {
      const response = await request.get(
        '/api/v1/suppliers',
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
    'SEC-REQ-002 - invalid supplier access token is rejected',
    async ({ request }) => {
      const response = await request.get(
        '/api/v1/suppliers',
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
    'SUP-REQ-001 - authenticated user can create a supplier',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const supplierData = {
        supplier_code:
          `API-${uniqueValue}`,
        supplier_name:
          `API Supplier ${uniqueValue}`,
        contact_name:
          'NEXORA API Contact',
        email:
          `nexora.supplier.${uniqueValue}@gmail.com`,
        phone:
          '0400000000',
        address:
          'Melbourne, Victoria',
        payment_terms:
          '30 days',
      }

      const response = await request.post(
        '/api/v1/suppliers',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          data: supplierData,
        },
      )

      const responseBody =
        await response.json()

      expect(
        response.status(),
        JSON.stringify(responseBody),
      ).toBe(201)

      const createdSupplier =
        responseBody as SupplierResponse

      expect(
        createdSupplier.supplier_id,
      ).toBeGreaterThan(0)

      expect(
        createdSupplier.supplier_code,
      ).toBe(supplierData.supplier_code)

      expect(
        createdSupplier.supplier_name,
      ).toBe(supplierData.supplier_name)

      expect(
        createdSupplier.contact_name,
      ).toBe(supplierData.contact_name)

      expect(
        createdSupplier.email,
      ).toBe(supplierData.email)

      expect(
        createdSupplier.phone,
      ).toBe(supplierData.phone)

      expect(
        createdSupplier.address,
      ).toBe(supplierData.address)

      expect(
        createdSupplier.payment_terms,
      ).toBe(supplierData.payment_terms)

      expect(
        createdSupplier.is_active,
      ).toBe(true)

      expect(
        createdSupplier.created_at,
      ).toBeTruthy()

      expect(
        createdSupplier.updated_at,
      ).toBeTruthy()
    },
  )

  test(
    'SUP-REQ-004 - authenticated user can retrieve a supplier by ID',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const supplierData = {
        supplier_code:
          `GET-${uniqueValue}`,
        supplier_name:
          `Retrieved Supplier ${uniqueValue}`,
        contact_name:
          'NEXORA Retrieval Contact',
        email:
          `nexora.retrieve.${uniqueValue}@gmail.com`,
        phone:
          '0411111111',
        address:
          'Melbourne, Victoria',
        payment_terms:
          '30 days',
      }

      // Create a supplier for this test.
      const createResponse =
        await request.post(
          '/api/v1/suppliers',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: supplierData,
          },
        )

      const createBody =
        await createResponse.json()

      expect(
        createResponse.status(),
        JSON.stringify(createBody),
      ).toBe(201)

      const createdSupplier =
        createBody as SupplierResponse

      expect(
        createdSupplier.supplier_id,
      ).toBeGreaterThan(0)

      // Retrieve the supplier using its generated ID.
      const getResponse =
        await request.get(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
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

      const retrievedSupplier =
        getBody as SupplierResponse

      expect(
        retrievedSupplier.supplier_id,
      ).toBe(createdSupplier.supplier_id)

      expect(
        retrievedSupplier.supplier_code,
      ).toBe(supplierData.supplier_code)

      expect(
        retrievedSupplier.supplier_name,
      ).toBe(supplierData.supplier_name)

      expect(
        retrievedSupplier.contact_name,
      ).toBe(supplierData.contact_name)

      expect(
        retrievedSupplier.email,
      ).toBe(supplierData.email)

      expect(
        retrievedSupplier.phone,
      ).toBe(supplierData.phone)

      expect(
        retrievedSupplier.address,
      ).toBe(supplierData.address)

      expect(
        retrievedSupplier.payment_terms,
      ).toBe(supplierData.payment_terms)

      expect(
        retrievedSupplier.is_active,
      ).toBe(true)

      expect(
        retrievedSupplier.created_at,
      ).toBeTruthy()

      expect(
        retrievedSupplier.updated_at,
      ).toBeTruthy()
    },
  )

  test(
    'SUP-REQ-003 - authenticated user can update a supplier',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const originalSupplierData = {
        supplier_code:
          `UPD-${uniqueValue}`,
        supplier_name:
          `Original Supplier ${uniqueValue}`,
        contact_name:
          'Original Contact',
        email:
          `nexora.update.${uniqueValue}@gmail.com`,
        phone:
          '0422222222',
        address:
          'Original Address',
        payment_terms:
          '30 days',
      }

      // Step 1: Create a supplier.
      const createResponse =
        await request.post(
          '/api/v1/suppliers',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: originalSupplierData,
          },
        )

      const createBody =
        await createResponse.json()

      expect(
        createResponse.status(),
        JSON.stringify(createBody),
      ).toBe(201)

      const createdSupplier =
        createBody as SupplierResponse

      expect(
        createdSupplier.supplier_id,
      ).toBeGreaterThan(0)

      // Step 2: Prepare the updated values.
      const updatedSupplierData = {
        supplier_name:
          `Updated Supplier ${uniqueValue}`,
        contact_name:
          'Updated NEXORA Contact',
        email:
          `nexora.updated.${uniqueValue}@gmail.com`,
        phone:
          '0433333333',
        address:
          'Updated Melbourne Address',
        payment_terms:
          '45 days',
      }

      // Step 3: Update the created supplier.
      const updateResponse =
        await request.patch(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: updatedSupplierData,
          },
        )

      const updateBody =
        await updateResponse.json()

      expect(
        updateResponse.status(),
        JSON.stringify(updateBody),
      ).toBe(200)

      const updatedSupplier =
        updateBody as SupplierResponse

      expect(
        updatedSupplier.supplier_id,
      ).toBe(createdSupplier.supplier_id)

      expect(
        updatedSupplier.supplier_code,
      ).toBe(originalSupplierData.supplier_code)

      expect(
        updatedSupplier.supplier_name,
      ).toBe(updatedSupplierData.supplier_name)

      expect(
        updatedSupplier.contact_name,
      ).toBe(updatedSupplierData.contact_name)

      expect(
        updatedSupplier.email,
      ).toBe(updatedSupplierData.email)

      expect(
        updatedSupplier.phone,
      ).toBe(updatedSupplierData.phone)

      expect(
        updatedSupplier.address,
      ).toBe(updatedSupplierData.address)

      expect(
        updatedSupplier.payment_terms,
      ).toBe(updatedSupplierData.payment_terms)

      expect(
        updatedSupplier.is_active,
      ).toBe(true)

      // Step 4: Retrieve it again to verify persistence.
      const getResponse =
        await request.get(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
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

      const retrievedSupplier =
        getBody as SupplierResponse

      expect(
        retrievedSupplier.supplier_name,
      ).toBe(updatedSupplierData.supplier_name)

      expect(
        retrievedSupplier.contact_name,
      ).toBe(updatedSupplierData.contact_name)

      expect(
        retrievedSupplier.email,
      ).toBe(updatedSupplierData.email)

      expect(
        retrievedSupplier.phone,
      ).toBe(updatedSupplierData.phone)

      expect(
        retrievedSupplier.address,
      ).toBe(updatedSupplierData.address)

      expect(
        retrievedSupplier.payment_terms,
      ).toBe(updatedSupplierData.payment_terms)
    },
  )
  test(
    'SUP-REQ-002 - duplicate supplier code is rejected',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const supplierData = {
        supplier_code:
          `DUP-${uniqueValue}`,
        supplier_name:
          `Duplicate Supplier ${uniqueValue}`,
        contact_name:
          'Duplicate Test Contact',
        email:
          `nexora.duplicate.${uniqueValue}@gmail.com`,
        phone:
          '0444444444',
        address:
          'Melbourne, Victoria',
        payment_terms:
          '30 days',
      }

      // First request should create the supplier.
      const firstResponse =
        await request.post(
          '/api/v1/suppliers',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: supplierData,
          },
        )

      const firstResponseBody =
        await firstResponse.json()

      expect(
        firstResponse.status(),
        JSON.stringify(firstResponseBody),
      ).toBe(201)

      expect(
        firstResponseBody.supplier_code,
      ).toBe(supplierData.supplier_code)

      // Second request uses the same supplier code.
      const duplicateResponse =
        await request.post(
          '/api/v1/suppliers',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: supplierData,
          },
        )

      const duplicateResponseBody =
        await duplicateResponse.json()

      expect(
        duplicateResponse.status(),
        JSON.stringify(duplicateResponseBody),
      ).toBe(409)

      expect(
        duplicateResponseBody.detail,
      ).toBeTruthy()
    },
  )
  test(
    'SUP-REQ-001 - missing supplier code is rejected',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const invalidSupplierData = {
        supplier_name:
          `Missing Code Supplier ${uniqueValue}`,
        contact_name:
          'Validation Test Contact',
        email:
          `nexora.validation.${uniqueValue}@gmail.com`,
        phone:
          '0455555555',
        address:
          'Melbourne, Victoria',
        payment_terms:
          '30 days',
      }

      const response = await request.post(
        '/api/v1/suppliers',
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          data: invalidSupplierData,
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

      expect(
        responseBody.detail.some(
          (
            validationError: {
              loc: Array<string>
            },
          ) =>
            validationError.loc.includes(
              'supplier_code',
            ),
        ),
      ).toBe(true)
    },
  )

    test(
    'SUP-REQ-005 - authenticated user can deactivate and reactivate a supplier',
    async ({ request }) => {
      const accessToken =
        await getAdminAccessToken(request)

      const uniqueValue = Date.now()

      const supplierData = {
        supplier_code:
          `STS-${uniqueValue}`,
        supplier_name:
          `Status Supplier ${uniqueValue}`,
        contact_name:
          'Supplier Status Contact',
        email:
          `nexora.status.${uniqueValue}@gmail.com`,
        phone:
          '0466666666',
        address:
          'Melbourne, Victoria',
        payment_terms:
          '30 days',
      }

      // Step 1: Create an active supplier.
      const createResponse =
        await request.post(
          '/api/v1/suppliers',
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: supplierData,
          },
        )

      const createBody =
        await createResponse.json()

      expect(
        createResponse.status(),
        JSON.stringify(createBody),
      ).toBe(201)

      const createdSupplier =
        createBody as SupplierResponse

      expect(createdSupplier.is_active).toBe(true)

      // Step 2: Deactivate the supplier.
      const deactivateResponse =
        await request.patch(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: {
              is_active: false,
            },
          },
        )

      const deactivateBody =
        await deactivateResponse.json()

      expect(
        deactivateResponse.status(),
        JSON.stringify(deactivateBody),
      ).toBe(200)

      expect(
        deactivateBody.is_active,
      ).toBe(false)

      // Step 3: Retrieve it to confirm deactivation was saved.
      const getInactiveResponse =
        await request.get(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        )

      const inactiveSupplier =
        await getInactiveResponse.json()

      expect(
        getInactiveResponse.status(),
        JSON.stringify(inactiveSupplier),
      ).toBe(200)

      expect(
        inactiveSupplier.is_active,
      ).toBe(false)

      // Step 4: Reactivate the supplier.
      const reactivateResponse =
        await request.patch(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            data: {
              is_active: true,
            },
          },
        )

      const reactivateBody =
        await reactivateResponse.json()

      expect(
        reactivateResponse.status(),
        JSON.stringify(reactivateBody),
      ).toBe(200)

      expect(
        reactivateBody.is_active,
      ).toBe(true)

      // Step 5: Retrieve it again to confirm reactivation.
      const getActiveResponse =
        await request.get(
          `/api/v1/suppliers/${createdSupplier.supplier_id}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
        )

      const activeSupplier =
        await getActiveResponse.json()

      expect(
        getActiveResponse.status(),
        JSON.stringify(activeSupplier),
      ).toBe(200)

      expect(
        activeSupplier.is_active,
      ).toBe(true)
    },
  )
})