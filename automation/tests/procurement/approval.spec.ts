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

    // ============================================================
    // AP-NAV-001
    // ============================================================

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

    // ============================================================
    // AP-LIST-001
    // Create PO -> Submit -> Verify PENDING
    // ============================================================

    test(
      'AP-LIST-001 submitted purchase order appears as PENDING in Approvals',
      async ({ page }) => {
        const po =
          new PurchaseOrderPage(page)

        const approval =
          new ApprovalPage(page)

        // --------------------------------------------------------
        // Create Purchase Order
        // --------------------------------------------------------

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

        await po.fillQuantity(
          1,
          '25',
        )

        if (
          await po
            .getTaxCode(1)
            .inputValue() === ''
        ) {
          await po.selectFirstTaxCode(
            1,
          )
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
          `PO creation failed with HTTP ${createResponse.status()}`,
        ).toBeTruthy()

        await expect(
          po.purchaseOrdersHeading,
        ).toBeVisible()

        // --------------------------------------------------------
        // Capture PO Number
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // Open Created PO
        // --------------------------------------------------------

        const poButton =
          page.getByRole(
            'button',
            {
              name: poNumber,
              exact: true,
            },
          )

        await expect(
          poButton,
        ).toBeVisible()

        await poButton.click()

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

        // --------------------------------------------------------
        // Submit for Approval
        // --------------------------------------------------------

        const submitButton =
          page.getByRole(
            'button',
            {
              name: 'Submit for Approval',
              exact: true,
            },
          )

        await expect(
          submitButton,
        ).toBeVisible()

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

        await submitButton.click()

        const approvalResponse =
          await approvalResponsePromise

        expect(
          approvalResponse.ok(),
          `Approval submission failed with HTTP ${approvalResponse.status()}`,
        ).toBeTruthy()

        // --------------------------------------------------------
        // Verify Pending Approval
        // --------------------------------------------------------

        await approval.openApprovals()

        await approval
          .searchForPurchaseOrder(
            poNumber,
          )

        await approval
          .expectApprovalVisible(
            poNumber,
          )

        await approval
          .expectApprovalStatus(
            poNumber,
            'PENDING',
          )
      },
    )

    // ============================================================
    // AP-APPROVE-001
    // Create PO -> Submit -> Review -> Approve
    // ============================================================

    test(
      'AP-APPROVE-001 pending purchase order can be approved',
      async ({ page }) => {
        const po =
          new PurchaseOrderPage(page)

        const approval =
          new ApprovalPage(page)

        // --------------------------------------------------------
        // Create Purchase Order
        // --------------------------------------------------------

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

        await po.fillQuantity(
          1,
          '25',
        )

        if (
          await po
            .getTaxCode(1)
            .inputValue() === ''
        ) {
          await po.selectFirstTaxCode(
            1,
          )
        }

        // Do not wait for the PO API response here.
        // PO creation is already tested separately.
        await po.saveDraft()

        await expect(
          po.purchaseOrdersHeading,
        ).toBeVisible()

        // --------------------------------------------------------
        // Capture Generated PO Number
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // Open Created PO
        // --------------------------------------------------------

        const poButton =
          page.getByRole(
            'button',
            {
              name: poNumber,
              exact: true,
            },
          )

        await expect(
          poButton,
        ).toBeVisible()

        await poButton.click()

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

        // --------------------------------------------------------
        // Submit PO for Approval
        // --------------------------------------------------------

        const submitButton =
          page.getByRole(
            'button',
            {
              name: 'Submit for Approval',
              exact: true,
            },
          )

        await expect(
          submitButton,
        ).toBeVisible()

        const approvalSubmitPromise =
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

        await submitButton.click()

        const approvalSubmitResponse =
          await approvalSubmitPromise

        expect(
          approvalSubmitResponse.ok(),
          `Approval submission failed with HTTP ${approvalSubmitResponse.status()}`,
        ).toBeTruthy()

        // --------------------------------------------------------
        // Open Approvals
        // --------------------------------------------------------

        await approval.openApprovals()

        await approval
          .searchForPurchaseOrder(
            poNumber,
          )

        await approval
          .expectApprovalVisible(
            poNumber,
          )

        await approval
          .expectApprovalStatus(
            poNumber,
            'PENDING',
          )

        // --------------------------------------------------------
        // Open Review
        // --------------------------------------------------------

        await approval
          .openApprovalReview(
            poNumber,
          )

        await expect(
          approval.approveButton,
        ).toBeVisible()

        // --------------------------------------------------------
        // Approve
        // --------------------------------------------------------

        await approval
          .approvePurchaseOrder()

        // --------------------------------------------------------
        // Verify Approval Result
        // --------------------------------------------------------

        await approval
          .expectApprovalSuccess()
      },
    )

  },
)