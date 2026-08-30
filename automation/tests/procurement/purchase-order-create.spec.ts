import {
  test,
  expect,
} from '../fixtures/authenticated-test'

import {
  ApprovalPage,
} from './pages/ApprovalPage'

import {
  PurchaseOrderPage,
} from './pages/PurchaseOrderPage'

test.describe(
  '@regression @approval Purchase Order Approval',
  () => {

    test(
      'AP-NAV-001 authenticated user can open Approvals',
      async ({ page }) => {
        const approval =
          new ApprovalPage(page)

        await approval.openApprovals()

        await expect(
          page.getByRole(
            'heading',
            {
              name: 'Approvals',
              exact: true,
              level: 1,
            },
          ),
        ).toBeVisible()
      },
    )

    test(
      'AP-LIST-001 submitted purchase order appears as PENDING in Approvals',
      async ({ page }) => {
        const po =
          new PurchaseOrderPage(page)

        const approval =
          new ApprovalPage(page)

        // ========================================================
        // CREATE A VALID PO
        // ========================================================

        await po.openNewPurchaseOrder()

        await po.selectSupplier(
          'SUP-104',
        )

        await po
          .selectFirstWarehouseWithReceivingLocation()

        await po
          .selectFirstReceivingLocation()

        await po.selectCatalogueItem(
          1,
          'RM-MILKPOWDER-001',
        )

        // Supplier minimum order quantity = 25
        await po.fillQuantity(
          1,
          '25',
        )

        if (
          await po
            .getTaxCode(1)
            .inputValue() === ''
        ) {
          await po.selectFirstTaxCode(1)
        }

        const createResponsePromise =
          page.waitForResponse(
            (response) =>
              response
                .url()
                .includes(
                  '/purchase-orders',
                ) &&
              response
                .request()
                .method() === 'POST',
          )

        await po.saveDraft()

        const createResponse =
          await createResponsePromise

        expect(
          createResponse.ok(),
        ).toBeTruthy()

        await expect(
          po.purchaseOrdersHeading,
        ).toBeVisible()

        // ========================================================
        // CAPTURE GENERATED PO NUMBER
        // ========================================================

        const successMessage =
          page.getByRole('status')

        await expect(
          successMessage,
        ).toContainText(
          /created successfully/i,
        )

        const message =
          await successMessage.textContent()

        if (!message) {
          throw new Error(
            'PO creation success message was not found',
          )
        }

        const poNumberMatch =
          message.match(
            /(PO-[A-Za-z0-9-]+)/i,
          )

        if (!poNumberMatch) {
          throw new Error(
            `Unable to extract PO number from: ${message}`,
          )
        }

        const poNumber =
          poNumberMatch[1]

        // ========================================================
        // OPEN CREATED PO
        // ========================================================

        await page
          .getByRole(
            'button',
            {
              name: poNumber,
              exact: true,
            },
          )
          .click()

        await expect(
          page.getByRole(
            'heading',
            {
              name: poNumber,
              exact: true,
              level: 1,
            },
          ),
        ).toBeVisible()

        // ========================================================
        // SUBMIT PO FOR APPROVAL
        // ========================================================

        const approvalResponsePromise =
          page.waitForResponse(
            (response) =>
              response
                .url()
                .includes(
                  '/approvals',
                ) &&
              response
                .request()
                .method() === 'POST',
          )

        await page
          .getByRole(
            'button',
            {
              name: 'Submit for Approval',
              exact: true,
            },
          )
          .click()

        const approvalResponse =
          await approvalResponsePromise

        expect(
          approvalResponse.ok(),
        ).toBeTruthy()

        // ========================================================
        // VERIFY EXACT PO IN APPROVALS
        // ========================================================

        await approval.openApprovals()

        await approval.searchForPurchaseOrder(
          poNumber,
        )

        await approval.expectApprovalVisible(
          poNumber,
        )

        await approval.expectApprovalStatus(
          poNumber,
          'PENDING',
        )
      },
    )

  },
)