import {
  expect,
  type Locator,
  type Page,
} from '@playwright/test'

export class ApprovalPage {
  readonly page: Page

  readonly approvalsNavigation: Locator
  readonly approvalsHeading: Locator
  readonly searchInput: Locator
  readonly refreshButton: Locator
  readonly comments: Locator
  readonly rejectButton: Locator
  readonly approveButton: Locator

  constructor(page: Page) {
    this.page = page

    this.approvalsNavigation =
      page.getByRole(
        'button',
        {
          name: 'Approvals',
          exact: true,
        },
      )

    this.approvalsHeading =
      page.getByRole(
        'heading',
        {
          name: 'Approvals',
          exact: true,
          level: 1,
        },
      )

    this.searchInput =
      page.getByPlaceholder(
        'Search approvals...',
      )

    this.refreshButton =
      page.getByRole(
        'button',
        {
          name: 'Refresh',
          exact: true,
        },
      )

    this.comments =
      page.locator(
        '[data-approval-field="comments"]',
      )

    this.rejectButton =
      page.getByRole(
        'button',
        {
          name: 'Reject',
          exact: true,
        },
      )

    this.approveButton =
      page.getByRole(
        'button',
        {
          name: 'Approve Purchase Order',
          exact: true,
        },
      )
  }

async openApprovals() {
  await this.page.goto('/')

  await expect(
    this.approvalsNavigation,
  ).toBeVisible()

  await this.approvalsNavigation.click()

  await expect(
    this.approvalsHeading,
  ).toBeVisible()
}
  async searchForPurchaseOrder(
    poNumber: string,
  ) {
    await this.searchInput.fill(
      poNumber,
    )

    await expect(
      this.getApprovalRow(poNumber),
    ).toBeVisible()
  }

  getApprovalRow(
    poNumber: string,
  ): Locator {
    return this.page
      .getByRole('row')
      .filter({
        hasText: poNumber,
      })
  }

  async expectApprovalVisible(
    poNumber: string,
  ) {
    await expect(
      this.getApprovalRow(poNumber),
    ).toBeVisible()
  }

  async expectApprovalStatus(
    poNumber: string,
    status: string,
  ) {
    const row =
      this.getApprovalRow(poNumber)

    await expect(
      row,
    ).toContainText(status)
  }

  async openApprovalReview(
    poNumber: string,
  ) {
    const row =
      this.getApprovalRow(poNumber)

    await expect(
      row,
    ).toBeVisible()

    await row
      .getByRole(
        'button',
        {
          name: 'Review',
          exact: true,
        },
      )
      .click()

    await expect(
      this.page.getByRole(
        'heading',
        {
          name: `Review ${poNumber}`,
          exact: true,
          level: 1,
        },
      ),
    ).toBeVisible()
  }

  async fillComments(
    comments: string,
  ) {
    await this.comments.fill(
      comments,
    )
  }

  async approvePurchaseOrder() {
    await expect(
      this.approveButton,
    ).toBeVisible()

    await this.approveButton.click()
  }

  async rejectPurchaseOrder() {
    await expect(
      this.rejectButton,
    ).toBeVisible()

    await this.rejectButton.click()
  }

  async expectRejectionReasonRequired() {
    await expect(
      this.page.getByText(
        'A rejection reason is required.',
        {
          exact: true,
        },
      ),
    ).toBeVisible()

    await expect(
      this.page.getByRole('alert'),
    ).toContainText(
      'Please provide a rejection reason before rejecting this purchase order.',
    )
  }

  async expectApprovalSuccess() {
    await expect(
      this.page.getByRole('status'),
    ).toContainText(
      'Purchase order approved successfully.',
    )
  }

  async expectRejectionSuccess() {
    await expect(
      this.page.getByRole('status'),
    ).toContainText(
      'Purchase order rejected successfully.',
    )
  }
}