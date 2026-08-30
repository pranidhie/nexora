export const purchaseRequestData = {
  valid: {
    department: 'Quality Assurance',

    purpose:
      'Automated Purchase Request created by Playwright regression test',

    priority: 'Normal',

    catalogueItem:
      'RM-MILKPOWDER-001 — Skim Milk Powder',

    quantity: '10',
  },

  invalidQuantities: {
    zero: '0',
    negative: '-1',
  },
}