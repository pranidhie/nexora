import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test'

export class PurchaseRequestPage {
  readonly page: Page

  readonly purchaseRequestsNavigation: Locator
  readonly purchaseRequestsHeading: Locator
  readonly newPurchaseRequestButton: Locator
  readonly newPurchaseRequestHeading: Locator

  readonly department: Locator
  readonly purpose: Locator
  readonly priority: Locator
  readonly requiredBy: Locator

  readonly addLineButton: Locator
  readonly createDraftButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    this.page = page

    this.purchaseRequestsNavigation =
      page.getByRole('button', {
        name: 'Purchase Requests',
        exact: true,
      })

    this.purchaseRequestsHeading =
      page.getByRole('heading', {
        name: 'Purchase Requests',
        level: 1,
      })

    this.newPurchaseRequestButton =
      page.getByRole('button', {
        name: /New Purchase Request/i,
      })

    this.newPurchaseRequestHeading =
      page.getByRole('heading', {
        name: /New Purchase Request/i,
      })

    this.department =
      page.getByLabel(/Department/i)

    this.purpose =
      page.getByLabel(/Purpose/i)

    this.priority =
      page.getByLabel(/Priority/i)

    this.requiredBy =
      page.getByLabel(/Required By/i)

    this.addLineButton =
      page.getByRole('button', {
        name: /Add Line/i,
      })

    this.createDraftButton =
      page.getByRole('button', {
        name: /Create Draft/i,
      })

    this.cancelButton =
      page.getByRole('button', {
        name: /Cancel/i,
      })
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  async openPurchaseRequests() {
    await this.page.goto('/')

    await this.purchaseRequestsNavigation.click()

    await expect(
      this.purchaseRequestsHeading,
    ).toBeVisible()
  }

  async openNewPurchaseRequest() {
    await this.openPurchaseRequests()

    await this.newPurchaseRequestButton.click()

    await expect(
      this.newPurchaseRequestHeading,
    ).toBeVisible()
  }

  // ============================================================
  // HEADER FIELDS
  // ============================================================

  async fillDepartment(
    value: string,
  ) {
    await this.department.fill(value)
  }

  async fillPurpose(
    value: string,
  ) {
    await this.purpose.fill(value)
  }

  async selectPriority(
    value: string,
  ) {
    await this.priority.selectOption({
      label: value,
    })
  }

  async fillRequiredBy(
    value: string,
  ) {
    await this.requiredBy.fill(value)
  }

  // ============================================================
  // LINE LOCATORS
  // ============================================================

  getCatalogueItemSelects(): Locator {
    return this.page
      .locator('select')
      .filter({
        has: this.page.locator(
          'option',
          {
            hasText:
              'Select catalogue item',
          },
        ),
      })
  }

  getCatalogueItem(
    index: number,
  ): Locator {
    return this
      .getCatalogueItemSelects()
      .nth(index)
  }

  getQuantity(
    index: number,
  ): Locator {
    return this.page.locator(
      `[data-pr-field="line-${index + 1}-quantity"]`,
    )
  }

  getUnitPrice(
    index: number,
  ): Locator {
    return this.page.locator(
      `[data-pr-field="line-${index + 1}-estimated_unit_price"]`,
    )
  }

  getLineTotal(
    index: number,
  ): Locator {
    return this
      .getCatalogueItem(index)
      .locator(
        'xpath=following::*[starts-with(normalize-space(.),"AUD ")][1]',
      )
  }

  getRemoveLineButton(
    index: number,
  ): Locator {
    return this.page
      .getByRole('button', {
        name: 'Remove',
        exact: true,
      })
      .nth(index)
  }

  // ============================================================
  // LINE ACTIONS
  // ============================================================

  async addLine() {
    await this.addLineButton.click()
  }

  async removeLine(
    index: number,
  ) {
    await this
      .getRemoveLineButton(index)
      .click()
  }

  async selectCatalogueItem(
    index: number,
    itemCode: string,
  ) {
    const item =
      this.getCatalogueItem(index)

    const option =
      item
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

    await item.selectOption(value)
  }

  async fillQuantity(
    index: number,
    quantity: string | number,
  ) {
    await this
      .getQuantity(index)
      .fill(String(quantity))
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async createDraft() {
    await this.createDraftButton.click()
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
      this.newPurchaseRequestHeading,
    ).toBeVisible()
  }
}