import {
  expect,
  test,
} from '../fixtures/authenticated-test'

import {
  closeDatabase,
  queryDatabase,
} from '../fixtures/database'

import {
  purchaseRequestData,
} from './data/purchase-request.data'

import {
  PurchaseRequestPage,
} from './pages/PurchaseRequestPage'

const CATALOGUE_ITEM =
  'RM-MILKPOWDER-001'

const VALID_QUANTITY = '10'

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

type PurchaseRequestDatabaseRow = {
  purchase_request_id: string
  request_number: string
  requested_by_user_id: string
  department: string
  purpose: string
  priority: string
  status: string
  total_estimated_amount: string
  required_by_date: Date | null
  created_at: Date
  updated_at: Date
}

test.describe(
  '@regression @three-layer Purchase Request validation',
  () => {
    test.afterAll(async () => {
      await closeDatabase()
    })

    test(
      'PR-E2E-001 - UI creation matches API response and database record',
      async ({ page }) => {
        const purchaseRequestPage =
          new PurchaseRequestPage(page)

        const uniquePurpose =
          `Three Layer PR ${Date.now()}`

        // ========================================================
        // LAYER 1: UI ACTION
        // ========================================================

        await purchaseRequestPage
          .openNewPurchaseRequest()

        await purchaseRequestPage
          .fillDepartment(
            purchaseRequestData.valid.department,
          )

        await purchaseRequestPage
          .fillPurpose(uniquePurpose)

        await purchaseRequestPage
          .selectCatalogueItem(
            0,
            CATALOGUE_ITEM,
          )

        await purchaseRequestPage
          .fillQuantity(
            0,
            VALID_QUANTITY,
          )

        // Start waiting before clicking the button.
        const createResponsePromise =
          page.waitForResponse(
            (response) =>
              response.url().includes(
                '/api/v1/purchase-requests',
              ) &&
              response.request().method() ===
                'POST',
          )

        await purchaseRequestPage.createDraft()

        const createResponse =
          await createResponsePromise

        // ========================================================
        // LAYER 2: API RESPONSE VALIDATION
        // ========================================================

        const responseBody =
          (await createResponse.json()) as PurchaseRequestResponse

        expect(
          createResponse.status(),
          `Purchase Request API returned: ${JSON.stringify(responseBody)}`,
        ).toBe(201)

        expect(
          responseBody.purchase_request_id,
        ).toBeGreaterThan(0)

        expect(
          responseBody.request_number,
        ).toBeTruthy()

        expect(responseBody.department).toBe(
          purchaseRequestData.valid.department,
        )

        expect(responseBody.purpose).toBe(
          uniquePurpose,
        )

        expect(responseBody.priority).toBe(
          'NORMAL',
        )

        expect(responseBody.status).toBe(
          'DRAFT',
        )

        expect(
          Number(
            responseBody.total_estimated_amount,
          ),
        ).toBeCloseTo(87.5, 2)

        expect(responseBody.items).toHaveLength(1)

        expect(
          responseBody.items[0].item_code,
        ).toBe(CATALOGUE_ITEM)

        expect(
          Number(responseBody.items[0].quantity),
        ).toBeCloseTo(10, 2)

        expect(
          Number(
            responseBody.items[0]
              .estimated_unit_price,
          ),
        ).toBeCloseTo(8.75, 2)

        expect(
          Number(
            responseBody.items[0]
              .estimated_total,
          ),
        ).toBeCloseTo(87.5, 2)

        // Confirm the result is shown in the UI.
        await expect(
          purchaseRequestPage
            .purchaseRequestsHeading,
        ).toBeVisible()

        await expect(
          page.getByText(uniquePurpose),
        ).toBeVisible()

        // ========================================================
        // LAYER 3: DATABASE VALIDATION
        // ========================================================

        const databaseRows =
          await queryDatabase<PurchaseRequestDatabaseRow>(
            `
              SELECT
                purchase_request_id::text,
                request_number,
                requested_by_user_id::text,
                department,
                purpose,
                priority,
                status,
                total_estimated_amount::text,
                required_by_date,
                created_at,
                updated_at
              FROM procurement.purchase_requests
              WHERE purchase_request_id = $1
            `,
            [
              responseBody.purchase_request_id,
            ],
          )

        expect(databaseRows).toHaveLength(1)

        const databaseRecord =
          databaseRows[0]

        expect(
          Number(
            databaseRecord.purchase_request_id,
          ),
        ).toBe(
          responseBody.purchase_request_id,
        )

        expect(
          databaseRecord.request_number,
        ).toBe(responseBody.request_number)

        expect(
          Number(
            databaseRecord.requested_by_user_id,
          ),
        ).toBe(
          responseBody.requested_by_user_id,
        )

        expect(databaseRecord.department).toBe(
          responseBody.department,
        )

        expect(databaseRecord.purpose).toBe(
          responseBody.purpose,
        )

        expect(databaseRecord.priority).toBe(
          responseBody.priority,
        )

        expect(databaseRecord.status).toBe(
          responseBody.status,
        )

        expect(
          Number(
            databaseRecord
              .total_estimated_amount,
          ),
        ).toBeCloseTo(
          Number(
            responseBody
              .total_estimated_amount,
          ),
          2,
        )

        expect(
          databaseRecord.created_at,
        ).toBeTruthy()

        expect(
          databaseRecord.updated_at,
        ).toBeTruthy()
      },
    )
  },
)