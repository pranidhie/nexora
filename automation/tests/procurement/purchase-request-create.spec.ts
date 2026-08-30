import {
  test,
  expect,
} from '../fixtures/authenticated-test'

import {
  PurchaseRequestPage,
} from './pages/PurchaseRequestPage'

import {
  purchaseRequestData,
} from './data/purchase-request.data'

const CATALOGUE_ITEM =
  'RM-MILKPOWDER-001'

const VALID_QUANTITY = '10'

test.describe(
  '@regression @purchase-request Purchase Request',
  () => {
    // ============================================================
    // NAVIGATION
    // ============================================================

    test(
      'PR-NAV-001 - authenticated user can open Purchase Requests',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openPurchaseRequests()

        await expect(
          pr.purchaseRequestsHeading,
        ).toBeVisible()
      },
    )

    test(
      'PR-NAV-002 - user can open New Purchase Request form',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await expect(
          pr.newPurchaseRequestHeading,
        ).toBeVisible()

        await expect(
          pr.createDraftButton,
        ).toBeVisible()
      },
    )

    // ============================================================
    // VALIDATION
    // ============================================================

    test(
      'PR-VAL-001 - empty mandatory form is blocked',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.createDraft()

        await expect(
          page
            .getByText(
              /required|mandatory|cannot be empty/i,
            )
            .first(),
        ).toBeVisible()

        await pr.expectStillOnCreatePage()
      },
    )

    test(
      'PR-VAL-002 - Department is mandatory',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.fillPurpose(
          purchaseRequestData.valid.purpose,
        )

        await pr.createDraft()

        await pr.expectValidation(
          /Department.*required|required.*Department/i,
        )

        await pr.expectStillOnCreatePage()
      },
    )

    test(
      'PR-VAL-003 - Purpose is mandatory',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.createDraft()

        await pr.expectValidation(
          /Purpose.*required|required.*Purpose/i,
        )

        await pr.expectStillOnCreatePage()
      },
    )

    test(
      'PR-VAL-004 - Catalogue Item is mandatory',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.fillPurpose(
          purchaseRequestData.valid.purpose,
        )

        await pr.createDraft()

        await pr.expectValidation(
          /Catalogue.*required|Item.*required|required.*Catalogue/i,
        )

        await pr.expectStillOnCreatePage()
      },
    )

    test(
      'PR-VAL-005 - zero quantity is rejected',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.fillPurpose(
          purchaseRequestData.valid.purpose,
        )

        await pr.selectCatalogueItem(
          0,
          CATALOGUE_ITEM,
        )

        await pr.fillQuantity(
          0,
          purchaseRequestData
            .invalidQuantities
            .zero,
        )

        await pr.createDraft()

        await pr.expectValidation(
          /Quantity.*greater than zero|Quantity.*required|invalid quantity/i,
        )

        await pr.expectStillOnCreatePage()
      },
    )

    test(
      'PR-VAL-006 - negative quantity is rejected',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.fillPurpose(
          purchaseRequestData.valid.purpose,
        )

        await pr.selectCatalogueItem(
          0,
          CATALOGUE_ITEM,
        )

        await pr.fillQuantity(
          0,
          purchaseRequestData
            .invalidQuantities
            .negative,
        )

        await pr.createDraft()

        await pr.expectValidation(
          /Quantity.*greater than zero|Quantity.*required|invalid quantity/i,
        )

        await pr.expectStillOnCreatePage()
      },
    )

    // ============================================================
    // REQUEST LINES
    // ============================================================

    test(
      'PR-LINE-001 - user can add another request line',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await expect(
          pr.getCatalogueItemSelects(),
        ).toHaveCount(1)

        await pr.addLine()

        await expect(
          pr.getCatalogueItemSelects(),
        ).toHaveCount(2)
      },
    )

    test(
      'PR-LINE-002 - user can remove an added request line',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await expect(
          pr.getCatalogueItemSelects(),
        ).toHaveCount(1)

        await pr.addLine()

        await expect(
          pr.getCatalogueItemSelects(),
        ).toHaveCount(2)

        await pr.removeLine(1)

        await expect(
          pr.getCatalogueItemSelects(),
        ).toHaveCount(1)
      },
    )

    // ============================================================
    // CALCULATION
    // ============================================================

    test(
      'PR-CALC-001 - line total equals quantity multiplied by unit price',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        await pr.openNewPurchaseRequest()

        await pr.selectCatalogueItem(
          0,
          CATALOGUE_ITEM,
        )

        await expect(
          pr.getUnitPrice(0),
        ).toHaveValue('8.75')

        await pr.fillQuantity(
          0,
          VALID_QUANTITY,
        )

        await expect(
          pr.getLineTotal(0),
        ).toContainText(
          'AUD 87.50',
        )
      },
    )

    // ============================================================
    // CREATE
    // ============================================================

    test(
      'PR-CREATE-001 - valid Purchase Request draft can be created',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        const uniquePurpose =
          `Playwright PR ${Date.now()}`

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.fillPurpose(
          uniquePurpose,
        )

        await pr.selectCatalogueItem(
          0,
          CATALOGUE_ITEM,
        )

        await pr.fillQuantity(
          0,
          VALID_QUANTITY,
        )

        const createResponsePromise =
          page.waitForResponse(
            (response) =>
              response
                .url()
                .includes(
                  '/purchase-requests',
                ) &&
              response
                .request()
                .method() ===
                'POST',
          )

        await pr.createDraft()

        const createResponse =
          await createResponsePromise

        expect(
          createResponse.ok(),
        ).toBeTruthy()

        await expect(
          pr.purchaseRequestsHeading,
        ).toBeVisible()

        await expect(
          page.getByText(
            uniquePurpose,
          ),
        ).toBeVisible()
      },
    )

    // ============================================================
    // PERSISTENCE
    // ============================================================

    test(
      'PR-PERSIST-001 - created Purchase Request remains after refresh',
      async ({ page }) => {
        const pr =
          new PurchaseRequestPage(page)

        const uniquePurpose =
          `Persistence PR ${Date.now()}`

        await pr.openNewPurchaseRequest()

        await pr.fillDepartment(
          purchaseRequestData.valid.department,
        )

        await pr.fillPurpose(
          uniquePurpose,
        )

        await pr.selectCatalogueItem(
          0,
          CATALOGUE_ITEM,
        )

        await pr.fillQuantity(
          0,
          VALID_QUANTITY,
        )

        await pr.createDraft()

        await expect(
          pr.purchaseRequestsHeading,
        ).toBeVisible()

        await expect(
          page.getByText(
            uniquePurpose,
          ),
        ).toBeVisible()

        await page.reload()

        await pr
          .purchaseRequestsNavigation
          .click()

        await expect(
          pr.purchaseRequestsHeading,
        ).toBeVisible()

        await expect(
          page.getByText(
            uniquePurpose,
          ),
        ).toBeVisible()
      },
    )
  },
)