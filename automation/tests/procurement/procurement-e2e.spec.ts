import {
  test,
  expect,
} from '../fixtures/authenticated-test'

import {
  PurchaseOrderPage,
} from './pages/PurchaseOrderPage'

import {
  ApprovalPage,
} from './pages/ApprovalPage'

import {
  GoodsReceiptPage,
} from './pages/GoodsReceiptPage'

import {
  InventoryPage,
} from './pages/InventoryPage'

test.describe(
  '@e2e @regression Procurement lifecycle',
  () => {

    test(
      'E2E-PROC-001 PO can be created approved received and posted to inventory',
      async ({ page }) => {
        const po =
          new PurchaseOrderPage(page)

        const approval =
          new ApprovalPage(page)

        const gr =
          new GoodsReceiptPage(page)

        const inventory =
          new InventoryPage(page)

        const itemCode =
          'RM-MILKPOWDER-001'

        const orderQuantity =
          '25'

        const receiptQuantity =
          '25'

        const deliveryReference =
          `AUTO-E2E-GR-${Date.now()}`

        // ========================================================
        // STEP 1
        // CREATE PURCHASE ORDER
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
          itemCode,
        )

        await po.fillQuantity(
          1,
          orderQuantity,
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

        await po.saveDraft()

        await expect(
          po.purchaseOrdersHeading,
        ).toBeVisible()

        // ========================================================
        // STEP 2
        // CAPTURE GENERATED PO NUMBER
        // ========================================================

        const poSuccessMessage =
          page.getByRole('status')

        await expect(
          poSuccessMessage,
        ).toContainText(
          /created successfully/i,
        )

        const poMessage =
          await poSuccessMessage
            .textContent()

        if (!poMessage) {
          throw new Error(
            'PO creation success message was not found',
          )
        }

        const poNumberMatch =
          poMessage.match(
            /(PO-[A-Za-z0-9-]+)/i,
          )

        if (!poNumberMatch) {
          throw new Error(
            `Unable to extract PO number from: ${poMessage}`,
          )
        }

        const poNumber =
          poNumberMatch[1]

        // ========================================================
        // STEP 3
        // OPEN CREATED PO
        // ========================================================

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

        // ========================================================
        // STEP 4
        // SUBMIT PO FOR APPROVAL
        // ========================================================

        const submitForApprovalButton =
          page.getByRole(
            'button',
            {
              name:
                'Submit for Approval',
              exact: true,
            },
          )

        await expect(
          submitForApprovalButton,
        ).toBeVisible()

        const submitApprovalPromise =
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

        await submitForApprovalButton
          .click()

        const submitApprovalResponse =
          await submitApprovalPromise

        expect(
          submitApprovalResponse.ok(),
          `Approval submission failed with HTTP ${submitApprovalResponse.status()}`,
        ).toBeTruthy()

        // ========================================================
        // STEP 5
        // FIND PENDING APPROVAL
        // ========================================================

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

        // ========================================================
        // STEP 6
        // APPROVE PURCHASE ORDER
        // ========================================================

        await approval
          .openApprovalReview(
            poNumber,
          )

        await expect(
          approval.approveButton,
        ).toBeVisible()

        await approval
          .approvePurchaseOrder()

        await approval
          .expectApprovalSuccess()

        // ========================================================
        // STEP 7
        // OPEN GOODS RECEIPT FORM
        // ========================================================

        await gr.openNewGoodsReceipt()

        // ========================================================
        // STEP 8
        // VERIFY EXACT APPROVED PO IS AVAILABLE
        // ========================================================

        await expect
          .poll(
            async () => {
              return await gr
                .purchaseOrder
                .locator('option')
                .filter({
                  hasText: poNumber,
                })
                .count()
            },
            {
              timeout:
                15_000,
            },
          )
          .toBe(1)

        await gr.selectPurchaseOrder(
          poNumber,
        )

        // ========================================================
        // STEP 9
        // ENTER GOODS RECEIPT DETAILS
        // ========================================================

        await gr.fillDeliveryReference(
          deliveryReference,
        )

        await gr.fillReceivedQuantity(
          receiptQuantity,
          1,
        )

        await gr.fillRejectedQuantity(
          '0',
          1,
        )

        // ========================================================
        // STEP 10
        // CREATE GOODS RECEIPT
        // ========================================================

        await gr.createGoodsReceipt()

        await expect(
          gr.goodsReceiptsHeading,
        ).toBeVisible()

        // ========================================================
        // STEP 11
        // CAPTURE GENERATED GOODS RECEIPT NUMBER
        // ========================================================

        const grSuccessMessage =
          page.getByRole('status')

        await expect(
          grSuccessMessage,
        ).toContainText(
          /created successfully/i,
        )

        await expect(
          grSuccessMessage,
        ).toContainText(
          /Inventory was updated/i,
        )

        const grMessage =
          await grSuccessMessage
            .textContent()

        if (!grMessage) {
          throw new Error(
            'Goods Receipt success message was not found',
          )
        }

        const grNumberMatch =
          grMessage.match(
            /([A-Za-z]+-[A-Za-z0-9-]+)\s+created successfully/i,
          )

        if (!grNumberMatch) {
          throw new Error(
            `Unable to extract Goods Receipt number from: ${grMessage}`,
          )
        }

        const receiptNumber =
          grNumberMatch[1]

        // ========================================================
        // STEP 12
        // VERIFY GOODS RECEIPT PERSISTED
        // ========================================================

        await gr.searchForReceipt(
          receiptNumber,
        )

        await gr.expectReceiptVisible(
          receiptNumber,
        )

        // ========================================================
        // STEP 13
        // VERIFY INVENTORY POSTING
        // ========================================================

        await inventory.openInventory()

        // Confirm stock balance exists for the received item.

        await inventory
          .expectStockBalanceVisible(
            itemCode,
          )

        // Use the generated Goods Receipt number as the
        // inventory ledger reference.
        //
        // Do not use deliveryReference here because the
        // delivery reference is not necessarily stored as
        // the inventory transaction reference.

        await inventory.search(
          receiptNumber,
        )

        const transactionRow =
          page
            .getByRole('row')
            .filter({
              hasText:
                receiptNumber,
            })
            .filter({
              hasText:
                itemCode,
            })
            .first()

        await expect(
          transactionRow,
        ).toBeVisible()

        // ========================================================
        // FINAL BUSINESS ASSERTION
        // VERIFY POSTED INVENTORY QUANTITY
        // ========================================================

        await expect(
          transactionRow,
        ).toContainText(
          receiptQuantity,
        )
      },
    )

  },
)