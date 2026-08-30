import {
  test,
  expect,
} from '../fixtures/authenticated-test'

import {
  GoodsReceiptPage,
} from './pages/GoodsReceiptPage'

test.describe(
  '@regression @goods-receipt Goods Receipt',
  () => {

    // ============================================================
    // GR-NAV-001
    // ============================================================

    test(
      'GR-NAV-001 authenticated user can open Goods Receipts',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openGoodsReceipts()

        await expect(
          gr.goodsReceiptsHeading,
        ).toBeVisible()
      },
    )

    // ============================================================
    // GR-NAV-002
    // ============================================================

    test(
      'GR-NAV-002 user can open New Goods Receipt form',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openNewGoodsReceipt()

        await expect(
          gr.newGoodsReceiptHeading,
        ).toBeVisible()
      },
    )

    // ============================================================
    // GR-VAL-001
    // Purchase Order is mandatory
    // ============================================================

    test(
      'GR-VAL-001 purchase order is mandatory',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openNewGoodsReceipt()

        await gr.createGoodsReceipt()

        await gr.expectValidation(
          /Purchase order is required/i,
        )

        await gr.expectStillOnCreatePage()
      },
    )

    // ============================================================
    // GR-VAL-002
    // Delivery Reference is mandatory
    // ============================================================

    test(
      'GR-VAL-002 delivery reference is mandatory',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openNewGoodsReceipt()

        const availablePo =
          gr.purchaseOrder.locator(
            'option:not([value="0"])',
          )

        await expect
          .poll(
            async () =>
              await availablePo.count(),
          )
          .toBeGreaterThan(0)

        const value =
          await availablePo
            .first()
            .getAttribute('value')

        if (!value) {
          throw new Error(
            'No receivable Purchase Order was available',
          )
        }

        await gr.purchaseOrder
          .selectOption(value)

        await gr.createGoodsReceipt()

        await gr.expectValidation(
          /Delivery reference is required/i,
        )

        await gr.expectStillOnCreatePage()
      },
    )

    // ============================================================
    // GR-VAL-003
    // At least one quantity is required
    // ============================================================

    test(
      'GR-VAL-003 at least one received or rejected quantity is required',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openNewGoodsReceipt()

        const availablePo =
          gr.purchaseOrder.locator(
            'option:not([value="0"])',
          )

        await expect
          .poll(
            async () =>
              await availablePo.count(),
          )
          .toBeGreaterThan(0)

        const value =
          await availablePo
            .first()
            .getAttribute('value')

        if (!value) {
          throw new Error(
            'No receivable Purchase Order was available',
          )
        }

        await gr.purchaseOrder
          .selectOption(value)

        await gr.fillDeliveryReference(
          `AUTO-GR-${Date.now()}`,
        )

        await gr.createGoodsReceipt()

        await gr.expectValidation(
          /Enter a received or rejected quantity for at least one line/i,
        )

        await gr.expectStillOnCreatePage()
      },
    )

    // ============================================================
    // GR-VAL-004
    // Received + Rejected must not exceed Outstanding
    // ============================================================

    test(
      'GR-VAL-004 received plus rejected cannot exceed outstanding quantity',
      async ({ page }) => {
        const gr =
          new GoodsReceiptPage(page)

        await gr.openNewGoodsReceipt()

        const availablePo =
          gr.purchaseOrder.locator(
            'option:not([value="0"])',
          )

        await expect
          .poll(
            async () =>
              await availablePo.count(),
          )
          .toBeGreaterThan(0)

        const value =
          await availablePo
            .first()
            .getAttribute('value')

        if (!value) {
          throw new Error(
            'No receivable Purchase Order was available',
          )
        }

        await gr.purchaseOrder
          .selectOption(value)

        await gr.fillDeliveryReference(
          `AUTO-GR-OVER-${Date.now()}`,
        )

        const receiveNow =
          gr.getReceiveNow(1)

        await expect(
          receiveNow,
        ).toBeVisible()

        const maxValue =
          await receiveNow.getAttribute(
            'max',
          )

        if (!maxValue) {
          throw new Error(
            'Outstanding quantity was not available',
          )
        }

        const outstanding =
          Number(maxValue)

        if (
          Number.isNaN(outstanding) ||
          outstanding <= 0
        ) {
          throw new Error(
            `Invalid outstanding quantity: ${maxValue}`,
          )
        }

        await gr.fillReceivedQuantity(
          String(outstanding),
        )

        await gr.fillRejectedQuantity(
          '1',
        )

        await gr.createGoodsReceipt()

        await gr.expectValidation(
          /Received plus rejected cannot exceed outstanding quantity/i,
        )

        await gr.expectStillOnCreatePage()
      },
    )

  },
)