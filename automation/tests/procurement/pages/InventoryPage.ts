import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test'

export class InventoryPage {
  readonly page: Page

  readonly inventoryNavigation: Locator
  readonly inventoryHeading: Locator
  readonly searchInput: Locator
  readonly refreshButton: Locator
  readonly stockOnHandHeading: Locator
  readonly stockTransactionsHeading: Locator

  constructor(page: Page) {
    this.page = page

    this.inventoryNavigation =
      page.getByRole(
        'button',
        {
          name: 'Inventory',
          exact: true,
        },
      )

    this.inventoryHeading =
      page.getByRole(
        'heading',
        {
          name: 'Inventory Management',
          exact: true,
          level: 1,
        },
      )

    this.searchInput =
      page.getByPlaceholder(
        'Search item, code, UOM, warehouse or transaction...',
      )

    this.refreshButton =
      page.getByRole(
        'button',
        {
          name: 'Refresh',
          exact: true,
        },
      )

    this.stockOnHandHeading =
      page.getByRole(
        'heading',
        {
          name: 'Stock On Hand',
          exact: true,
        },
      )

    this.stockTransactionsHeading =
      page.getByRole(
        'heading',
        {
          name: 'Stock Transactions',
          exact: true,
        },
      )
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  async openInventory() {
    await this.page.goto('/')

    await expect(
      this.inventoryNavigation,
    ).toBeVisible()

    await this
      .inventoryNavigation
      .click()

    await expect(
      this.inventoryHeading,
    ).toBeVisible()

    await expect(
      this.stockOnHandHeading,
    ).toBeVisible()

    await expect(
      this.stockTransactionsHeading,
    ).toBeVisible()
  }

  // ============================================================
  // SEARCH
  // ============================================================

  async search(
    value: string,
  ) {
    await expect(
      this.searchInput,
    ).toBeVisible()

    await this.searchInput.fill(
      value,
    )
  }

  async clearSearch() {
    await this.searchInput.fill('')
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async refresh() {
    await expect(
      this.refreshButton,
    ).toBeVisible()

    await this.refreshButton.click()

    await expect(
      this.refreshButton,
    ).toHaveText(
      'Refresh',
    )
  }

  // ============================================================
  // STOCK BALANCE
  // ============================================================

  getStockBalanceRow(
    itemCode: string,
  ): Locator {
    return this.page
      .getByRole('row')
      .filter({
        hasText: itemCode,
      })
      .filter({
        has: this.page.getByText(
          itemCode,
          {
            exact: true,
          },
        ),
      })
      .first()
  }

  async expectStockBalanceVisible(
    itemCode: string,
  ) {
    await this.search(itemCode)

    await expect(
      this.getStockBalanceRow(
        itemCode,
      ),
    ).toBeVisible()
  }

  // ============================================================
  // INVENTORY TRANSACTION
  // ============================================================

  getTransactionRowByReference(
    reference: string,
  ): Locator {
    return this.page
      .getByRole('row')
      .filter({
        hasText: reference,
      })
      .first()
  }

  async expectTransactionVisible(
    reference: string,
  ) {
    await this.search(reference)

    await expect(
      this.getTransactionRowByReference(
        reference,
      ),
    ).toBeVisible()
  }

  async expectTransactionForItem(
    itemCode: string,
  ) {
    await this.search(itemCode)

    const row =
      this.page
        .getByRole('row')
        .filter({
          hasText: itemCode,
        })

    await expect(
      row.last(),
    ).toBeVisible()
  }

  // ============================================================
  // STRONG E2E ASSERTION
  // ============================================================

  async expectGoodsReceiptTransaction(
    reference: string,
    itemCode: string,
  ) {
    await this.search(reference)

    const transactionRow =
      this.page
        .getByRole('row')
        .filter({
          hasText: reference,
        })
        .filter({
          hasText: itemCode,
        })
        .first()

    await expect(
      transactionRow,
    ).toBeVisible()
  }
}