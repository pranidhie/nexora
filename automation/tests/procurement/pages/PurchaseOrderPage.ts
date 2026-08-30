import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test'

export class PurchaseOrderPage {
  readonly page: Page

  readonly purchaseOrdersNavigation: Locator
  readonly purchaseOrdersHeading: Locator
  readonly newPurchaseOrderButton: Locator
  readonly newPurchaseOrderHeading: Locator

  readonly supplier: Locator
  readonly warehouse: Locator
  readonly receivingLocation: Locator
  readonly currency: Locator

  readonly addLineButton: Locator
  readonly saveDraftButton: Locator

  constructor(page: Page) {
    this.page = page

    this.purchaseOrdersNavigation =
      page.getByRole('button', {
        name: 'Purchase Orders',
        exact: true,
      })

    this.purchaseOrdersHeading =
      page.getByRole('heading', {
        name: 'Purchase Orders',
        level: 1,
      })

    this.newPurchaseOrderButton =
      page.getByRole('button', {
        name: /New Purchase Order/i,
      })

    this.newPurchaseOrderHeading =
      page.getByRole('heading', {
        name: 'New Purchase Order',
      })

    this.supplier =
      page.locator(
        '[data-po-field="supplier_id"]',
      )

    this.warehouse =
      page.locator(
        '[data-po-field="warehouse_id"]',
      )

    this.receivingLocation =
      page.locator(
        '[data-po-field="receiving_location_id"]',
      )

    this.currency =
      page.locator(
        '[data-po-field="currency"]',
      )

    this.addLineButton =
      page.getByRole('button', {
        name: '+ Add Line',
        exact: true,
      })

    this.saveDraftButton =
      page.getByRole('button', {
        name: 'Save Draft PO',
        exact: true,
      })
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  async openPurchaseOrders() {
    await this.page.goto('/')

    await this.purchaseOrdersNavigation.click()

    await expect(
      this.purchaseOrdersHeading,
    ).toBeVisible()
  }

  async openNewPurchaseOrder() {
    await this.openPurchaseOrders()

    await this.newPurchaseOrderButton.click()

    await expect(
      this.newPurchaseOrderHeading,
    ).toBeVisible()
  }

  // ============================================================
  // HEADER
  // ============================================================

  async selectSupplier(
    supplierCode: string,
  ) {
    const option =
      this.supplier
        .locator('option')
        .filter({
          hasText: supplierCode,
        })

    const value =
      await option.getAttribute('value')

    if (!value) {
      throw new Error(
        `Supplier "${supplierCode}" was not found`,
      )
    }

    await this.supplier.selectOption(value)
  }

  async selectWarehouse(
    warehouseCode: string,
  ) {
    const option =
      this.warehouse
        .locator('option')
        .filter({
          hasText: warehouseCode,
        })

    const value =
      await option.getAttribute('value')

    if (!value) {
      throw new Error(
        `Warehouse "${warehouseCode}" was not found`,
      )
    }

    await this.warehouse.selectOption(value)

    await expect(
      this.receivingLocation,
    ).toBeEnabled()
  }

  async selectFirstWarehouseWithReceivingLocation() {
  const warehouseOptions =
    this.warehouse.locator(
      'option:not([value=""])',
    )

  const warehouseCount =
    await warehouseOptions.count()

  for (
    let index = 0;
    index < warehouseCount;
    index++
  ) {
    const value =
      await warehouseOptions
        .nth(index)
        .getAttribute('value')

    if (!value) {
      continue
    }

    await this.warehouse.selectOption(
      value,
    )

    try {
      await expect
        .poll(
          async () =>
            await this.receivingLocation
              .locator(
                'option:not([value=""])',
              )
              .count(),
          {
            timeout: 3000,
          },
        )
        .toBeGreaterThan(0)

      return
    } catch {
      // Try the next active warehouse.
    }
  }

  throw new Error(
    'No active warehouse with a receiving location was found',
  )
}

async selectFirstReceivingLocation() {
  const availableLocations =
    this.receivingLocation.locator(
      'option:not([value=""])',
    )

  await expect
    .poll(
      async () =>
        await availableLocations.count(),
    )
    .toBeGreaterThan(0)

  const value =
    await availableLocations
      .first()
      .getAttribute('value')

  if (!value) {
    throw new Error(
      'No receiving location was available',
    )
  }

  await this.receivingLocation
    .selectOption(value)
}

  // ============================================================
  // LINE LOCATORS
  // ============================================================

  getCatalogueItem(
    lineNumber: number,
  ): Locator {
    return this.page.locator(
      `[data-po-field="line-${lineNumber}-catalogue_item_id"]`,
    )
  }

  getQuantity(
    lineNumber: number,
  ): Locator {
    return this.page.locator(
      `[data-po-field="line-${lineNumber}-quantity"]`,
    )
  }

  getUom(
    lineNumber: number,
  ): Locator {
    return this.page.locator(
      `[data-po-field="line-${lineNumber}-unit_of_measure"]`,
    )
  }

  getUnitPrice(
    lineNumber: number,
  ): Locator {
    return this.page.locator(
      `[data-po-field="line-${lineNumber}-unit_price"]`,
    )
  }

  getTaxCode(
    lineNumber: number,
  ): Locator {
    return this.page.locator(
      `[data-po-field="line-${lineNumber}-tax_code_id"]`,
    )
  }

  // ============================================================
  // LINE ACTIONS
  // ============================================================

  async selectCatalogueItem(
    lineNumber: number,
    itemCode: string,
  ) {
    const catalogueItem =
      this.getCatalogueItem(lineNumber)

    const option =
      catalogueItem
        .locator('option')
        .filter({
          hasText: itemCode,
        })

    const value =
      await option.getAttribute('value')

    if (!value) {
      throw new Error(
        `Catalogue item "${itemCode}" was not found`,
      )
    }

    await catalogueItem.selectOption(value)

    // Supplier pricing is loaded asynchronously.
    await expect(
      this.getUnitPrice(lineNumber),
    ).not.toHaveValue('')
  }

  async fillQuantity(
    lineNumber: number,
    quantity: string | number,
  ) {
    await this
      .getQuantity(lineNumber)
      .fill(String(quantity))
  }

  async selectFirstTaxCode(
    lineNumber: number,
  ) {
    const taxCode =
      this.getTaxCode(lineNumber)

    const value =
      await taxCode
        .locator('option')
        .nth(1)
        .getAttribute('value')

    if (!value) {
      throw new Error(
        'No tax code was available',
      )
    }

    await taxCode.selectOption(value)
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async saveDraft() {
    await this.saveDraftButton.click()
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  async expectValidation(
    message: string | RegExp,
  ) {
    await expect(
      this.page
        .getByText(message)
        .first(),
    ).toBeVisible()
  }

  async expectStillOnCreatePage() {
    await expect(
      this.newPurchaseOrderHeading,
    ).toBeVisible()



  }


  // ============================================================
// PO DETAILS / APPROVAL
// ============================================================

getPoNumberButton(
  poNumber: string,
): Locator {
  return this.page.getByRole(
    'button',
    {
      name: poNumber,
      exact: true,
    },
  )
}

readonlySubmitForApproval(): Locator {
  return this.page.getByRole(
    'button',
    {
      name: 'Submit for Approval',
      exact: true,
    },
  )
}

async openPurchaseOrder(
  poNumber: string,
) {
  await this
    .getPoNumberButton(poNumber)
    .click()

  await expect(
    this.page.getByRole(
      'heading',
      {
        name: poNumber,
        exact: true,
      },
    ),
  ).toBeVisible()

  await expect(
    this.page.getByRole(
      'heading',
      {
        name: 'Purchase Order Approval',
        exact: true,
      },
    ),
  ).toBeVisible()
}

async submitForApproval() {
  const button =
    this.readonlySubmitForApproval()

  await expect(
    button,
  ).toBeVisible()

  await button.click()
}
}