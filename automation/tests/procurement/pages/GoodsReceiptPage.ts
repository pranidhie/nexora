import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test'

export class GoodsReceiptPage {
  readonly page: Page

  readonly goodsReceiptsNavigation: Locator
  readonly goodsReceiptsHeading: Locator
  readonly newGoodsReceiptButton: Locator
  readonly newGoodsReceiptHeading: Locator

  readonly purchaseOrder: Locator
  readonly deliveryReference: Locator
  readonly createGoodsReceiptButton: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page

    this.goodsReceiptsNavigation =
      page.getByRole(
        'button',
        {
          name: 'Goods Receipts',
          exact: true,
        },
      )

    this.goodsReceiptsHeading =
      page.getByRole(
        'heading',
        {
          name: 'Goods Receipts',
          exact: true,
          level: 1,
        },
      )

    this.newGoodsReceiptButton =
      page.getByRole(
        'button',
        {
          name: '+ New Goods Receipt',
          exact: true,
        },
      )

    this.newGoodsReceiptHeading =
      page.getByRole(
        'heading',
        {
          name: 'New Goods Receipt',
          exact: true,
          level: 1,
        },
      )

    this.purchaseOrder =
      page.locator(
        '[data-gr-field="purchase_order_id"]',
      )

    this.deliveryReference =
      page.locator(
        '[data-gr-field="delivery_reference"]',
      )

    this.createGoodsReceiptButton =
      page.getByRole(
        'button',
        {
          name: 'Create Goods Receipt',
          exact: true,
        },
      )

    this.searchInput =
      page.getByPlaceholder(
        'Search goods receipts...',
      )
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  async openGoodsReceipts() {
    await this.page.goto('/')

    await expect(
      this.goodsReceiptsNavigation,
    ).toBeVisible()

    await this
      .goodsReceiptsNavigation
      .click()

    await expect(
      this.goodsReceiptsHeading,
    ).toBeVisible()
  }

  async openNewGoodsReceipt() {
    await this.openGoodsReceipts()

    await expect(
      this.newGoodsReceiptButton,
    ).toBeVisible()

    await this
      .newGoodsReceiptButton
      .click()

    await expect(
      this.newGoodsReceiptHeading,
    ).toBeVisible()
  }

  // ============================================================
  // PURCHASE ORDER
  // ============================================================

  async selectPurchaseOrder(
    poNumber: string,
  ) {
    await expect(
      this.purchaseOrder,
    ).toBeVisible()

    const option =
      this.purchaseOrder
        .locator('option')
        .filter({
          hasText: poNumber,
        })

    await expect(
      option,
    ).toHaveCount(1)

    const value =
      await option.getAttribute(
        'value',
      )

    if (!value) {
      throw new Error(
        `Unable to select Purchase Order ${poNumber}`,
      )
    }

    await this.purchaseOrder
      .selectOption(value)

    await expect(
      this.page.getByRole(
        'heading',
        {
          name: 'Material Receipt Lines',
          exact: true,
        },
      ),
    ).toBeVisible()
  }

  // ============================================================
  // HEADER
  // ============================================================

  async fillDeliveryReference(
    reference: string,
  ) {
    await this.deliveryReference
      .fill(reference)
  }

  // ============================================================
  // RECEIPT LINE
  // ============================================================

  getReceiveNow(
    lineNumber = 1,
  ): Locator {
    return this.page
      .locator(
        '[data-gr-field$="-received_quantity"]',
      )
      .nth(
        lineNumber - 1,
      )
  }

  getRejectedQuantity(
    lineNumber = 1,
  ): Locator {
    return this.page
      .locator(
        '[data-gr-field$="-rejected_quantity"]',
      )
      .nth(
        lineNumber - 1,
      )
  }

  async fillReceivedQuantity(
    quantity: string,
    lineNumber = 1,
  ) {
    await this
      .getReceiveNow(lineNumber)
      .fill(quantity)
  }

  async fillRejectedQuantity(
    quantity: string,
    lineNumber = 1,
  ) {
    await this
      .getRejectedQuantity(
        lineNumber,
      )
      .fill(quantity)
  }

  // ============================================================
  // CREATE
  // ============================================================

  async createGoodsReceipt() {
    await expect(
      this.createGoodsReceiptButton,
    ).toBeVisible()

    await this
      .createGoodsReceiptButton
      .click()
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  async expectValidation(
    message: string | RegExp,
  ) {
    await expect(
      this.page.getByText(
        message,
      ).first(),
    ).toBeVisible()
  }

  async expectStillOnCreatePage() {
    await expect(
      this.newGoodsReceiptHeading,
    ).toBeVisible()
  }

  // ============================================================
  // LIST / SEARCH
  // ============================================================

  async searchForReceipt(
    receiptNumber: string,
  ) {
    await this.searchInput
      .fill(receiptNumber)

    await expect(
      this.getReceiptRow(
        receiptNumber,
      ),
    ).toBeVisible()
  }

  getReceiptRow(
    receiptNumber: string,
  ): Locator {
    return this.page
      .getByRole('row')
      .filter({
        hasText: receiptNumber,
      })
  }

  async expectReceiptVisible(
    receiptNumber: string,
  ) {
    await expect(
      this.getReceiptRow(
        receiptNumber,
      ),
    ).toBeVisible()
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  async getCreatedReceiptNumber():
    Promise<string> {
    const successMessage =
      this.page.getByRole(
        'status',
      )

    await expect(
      successMessage,
    ).toContainText(
      /created successfully/i,
    )

    const message =
      await successMessage
        .textContent()

    if (!message) {
      throw new Error(
        'Goods Receipt creation success message was not found',
      )
    }

    const match =
      message.match(
        /([A-Za-z]+-[A-Za-z0-9-]+)/,
      )

    if (!match) {
      throw new Error(
        `Unable to extract Goods Receipt number from: ${message}`,
      )
    }

    return match[1]
  }
}