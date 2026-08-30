import { apiClient } from './client'

import type {
  Approval,
  CatalogueItem,
  Currency,
  DocumentStatusHistory,
  ExchangeRate,
  GoodsReceipt,
  InventoryBalance,
  InventoryTransaction,
  ItemCategory,
  PurchaseOrder,
  PurchaseRequest,
  Supplier,
  SupplierItem,
  TaxCode,
  UnitOfMeasure,
} from '../types/procurement'


// ============================================================
// SUPPLIER PAYLOADS
// ============================================================

export type CreateSupplierPayload = {
  supplier_code: string
  supplier_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
}


export type UpdateSupplierPayload = {
  supplier_name?: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  payment_terms?: string | null
  is_active?: boolean
}


// ============================================================
// CATALOGUE PAYLOADS
// ============================================================

export type CreateCatalogueItemPayload = {
  item_code: string
  item_name: string
  item_type: string
  category_id: number

  purchase_uom_id: number
  stock_uom_id: number | null

  conversion_factor: number | null

  shelf_life_days: number | null
  storage_condition: string | null

  batch_tracking_required: boolean
  expiry_tracking_required: boolean

  allergen_information: string | null
  country_of_origin: string | null

  created_by: number
  updated_by: number
}


export type UpdateCatalogueItemPayload = {
  item_name?: string
  item_type?: string
  category_id?: number

  purchase_uom_id?: number
  stock_uom_id?: number | null

  conversion_factor?: number | null

  shelf_life_days?: number | null
  storage_condition?: string | null

  batch_tracking_required?: boolean
  expiry_tracking_required?: boolean

  allergen_information?: string | null
  country_of_origin?: string | null

  status?: string

  updated_by: number
}


// ============================================================
// SUPPLIER ITEM / PRICING PAYLOADS
// ============================================================

export type LinkSupplierPayload = {
  supplier_id: number

  supplier_item_code: string | null

  purchase_uom_id: number

  unit_price: number

  currency_code: string

  minimum_order_quantity: number | null

  lead_time_days: number | null

  preferred_supplier: boolean

  effective_from: string
  effective_to: string | null

  active: boolean

  created_by: number
  updated_by: number
}


export type UpdateSupplierItemPayload = {
  supplier_item_code?: string | null

  purchase_uom_id?: number

  unit_price?: number

  currency_code?: string

  minimum_order_quantity?: number | null

  lead_time_days?: number | null

  preferred_supplier?: boolean

  effective_from?: string
  effective_to?: string | null

  active?: boolean

  updated_by: number
}


// ============================================================
// PURCHASE REQUEST
// ============================================================

export type CreatePurchaseRequestPayload = {
  requested_by_user_id: number

  department: string

  purpose: string

  priority: string

  required_by_date: string | null

  items: {
    item_code: string | null

    description: string

    quantity: number

    unit_of_measure: string

    estimated_unit_price: number

    notes: string | null
  }[]
}


// ============================================================
// PURCHASE ORDER
// ============================================================

export type CreatePurchaseOrderPayload = {
  supplier_id: number

  purchase_request_id: number | null

  created_by_user_id: number

  warehouse_id: number | null

  receiving_location_id: number | null

  currency: string

  delivery_address: string | null

  notes: string | null

  expected_delivery_date: string | null

  items: {
    item_code: string | null

    description: string

    quantity: number

    unit_of_measure: string

    unit_price: number

    // Tax is selected by code.
    // Backend calculates rate + amount.
    tax_code_id: number

    notes: string | null
  }[]
}


// ============================================================
// APPROVAL
// ============================================================

export type CreateApprovalPayload = {
  document_type: string

  document_id: number

  approver_user_id: number

  approval_level: number

  comments: string | null
}


export type ApprovalDecisionPayload = {
  status:
    | 'APPROVED'
    | 'REJECTED'

  comments: string | null
}


// ============================================================
// GOODS RECEIPT
// ============================================================

export type CreateGoodsReceiptPayload = {
  purchase_order_id: number

  received_by_user_id: number

  delivery_reference: string | null

  notes: string | null

  items: {
    purchase_order_item_id: number

    item_code: string | null

    description: string

    ordered_quantity: number

    received_quantity: number

    rejected_quantity: number

    unit_of_measure: string

    notes: string | null
  }[]
}


// ============================================================
// COMMON RESPONSE HANDLER
// ============================================================

async function jsonOrThrow<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  if (!response.ok) {
    const errorData =
      await response
        .json()
        .catch(() => null)

    throw new Error(
      errorData?.detail ??
        fallback,
    )
  }

  return response.json()
}


// ============================================================
// SUPPLIERS
// ============================================================

export const getSuppliers =
  async () =>
    jsonOrThrow<Supplier[]>(
      await apiClient(
        '/api/v1/suppliers',
      ),
      'Unable to load suppliers.',
    )


export const createSupplier =
  async (
    payload:
      CreateSupplierPayload,
  ) =>
    jsonOrThrow<Supplier>(
      await apiClient(
        '/api/v1/suppliers',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to create supplier.',
    )


export const updateSupplier =
  async (
    id: number,
    payload:
      UpdateSupplierPayload,
  ) =>
    jsonOrThrow<Supplier>(
      await apiClient(
        `/api/v1/suppliers/${id}`,
        {
          method: 'PATCH',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to update supplier.',
    )


// ============================================================
// PURCHASE REQUESTS
// ============================================================

export const getPurchaseRequests =
  async () =>
    jsonOrThrow<
      PurchaseRequest[]
    >(
      await apiClient(
        '/api/v1/purchase-requests',
      ),
      'Unable to load purchase requests.',
    )


export const createPurchaseRequest =
  async (
    payload:
      CreatePurchaseRequestPayload,
  ) =>
    jsonOrThrow<
      PurchaseRequest
    >(
      await apiClient(
        '/api/v1/purchase-requests',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to create purchase request.',
    )


// ============================================================
// PURCHASE ORDERS
// ============================================================

export const getPurchaseOrders =
  async () =>
    jsonOrThrow<
      PurchaseOrder[]
    >(
      await apiClient(
        '/api/v1/purchase-orders',
      ),
      'Unable to load purchase orders.',
    )


export const createPurchaseOrder =
  async (
    payload:
      CreatePurchaseOrderPayload,
  ) =>
    jsonOrThrow<
      PurchaseOrder
    >(
      await apiClient(
        '/api/v1/purchase-orders',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to create purchase order.',
    )


// ============================================================
// APPROVALS
// ============================================================

export const getApprovals =
  async () =>
    jsonOrThrow<Approval[]>(
      await apiClient(
        '/api/v1/approvals',
      ),
      'Unable to load approvals.',
    )


export const createApproval =
  async (
    payload:
      CreateApprovalPayload,
  ) =>
    jsonOrThrow<Approval>(
      await apiClient(
        '/api/v1/approvals',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to submit document for approval.',
    )


export const decideApproval =
  async (
    id: number,
    payload:
      ApprovalDecisionPayload,
  ) =>
    jsonOrThrow<Approval>(
      await apiClient(
        `/api/v1/approvals/${id}/decision`,
        {
          method: 'PATCH',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to process approval decision.',
    )


// ============================================================
// STATUS HISTORY
// ============================================================

export const getStatusHistory =
  async (
    type: string,
    id: number,
  ) =>
    jsonOrThrow<
      DocumentStatusHistory[]
    >(
      await apiClient(
        `/api/v1/status-history/${type}/${id}`,
      ),
      'Unable to load status history.',
    )


// ============================================================
// GOODS RECEIPTS
// ============================================================

export const getGoodsReceipts =
  async () =>
    jsonOrThrow<
      GoodsReceipt[]
    >(
      await apiClient(
        '/api/v1/goods-receipts',
      ),
      'Unable to load goods receipts.',
    )


export const createGoodsReceipt =
  async (
    payload:
      CreateGoodsReceiptPayload,
  ) =>
    jsonOrThrow<
      GoodsReceipt
    >(
      await apiClient(
        '/api/v1/goods-receipts',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to create goods receipt.',
    )


// ============================================================
// INVENTORY
// ============================================================

export const getInventoryBalances =
  async () =>
    jsonOrThrow<
      InventoryBalance[]
    >(
      await apiClient(
        '/api/v1/inventory/balances',
      ),
      'Unable to load inventory balances.',
    )


export const getInventoryTransactions =
  async (
    catalogueItemId?: number,
  ) =>
    jsonOrThrow<
      InventoryTransaction[]
    >(
      await apiClient(
        `/api/v1/inventory/transactions${
          catalogueItemId
            ? `?catalogue_item_id=${catalogueItemId}`
            : ''
        }`,
      ),
      'Unable to load inventory transactions.',
    )


// ============================================================
// CATALOGUE
// ============================================================

export const getCatalogueCategories =
  async () =>
    jsonOrThrow<
      ItemCategory[]
    >(
      await apiClient(
        '/api/v1/catalogue/categories',
      ),
      'Unable to load catalogue categories.',
    )


export const getCatalogueUoms =
  async () =>
    jsonOrThrow<
      UnitOfMeasure[]
    >(
      await apiClient(
        '/api/v1/catalogue/uoms',
      ),
      'Unable to load units of measure.',
    )


export const getCatalogueItems =
  async () =>
    jsonOrThrow<
      CatalogueItem[]
    >(
      await apiClient(
        '/api/v1/catalogue/items',
      ),
      'Unable to load catalogue items.',
    )


export const createCatalogueItem =
  async (
    payload:
      CreateCatalogueItemPayload,
  ) =>
    jsonOrThrow<
      CatalogueItem
    >(
      await apiClient(
        '/api/v1/catalogue/items',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to create catalogue item.',
    )


export const updateCatalogueItem =
  async (
    id: number,
    payload:
      UpdateCatalogueItemPayload,
  ) =>
    jsonOrThrow<
      CatalogueItem
    >(
      await apiClient(
        `/api/v1/catalogue/items/${id}`,
        {
          method: 'PATCH',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to update catalogue item.',
    )


// ============================================================
// SUPPLIER PRICING
// ============================================================

export const getSupplierItemsForCatalogueItem =
  async (
    id: number,
  ) =>
    jsonOrThrow<
      SupplierItem[]
    >(
      await apiClient(
        `/api/v1/catalogue/items/${id}/suppliers`,
      ),
      'Unable to load catalogue supplier pricing.',
    )


export const linkSupplierToCatalogueItem =
  async (
    id: number,
    payload:
      LinkSupplierPayload,
  ) =>
    jsonOrThrow<
      SupplierItem
    >(
      await apiClient(
        `/api/v1/catalogue/items/${id}/suppliers`,
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to link supplier to catalogue item.',
    )


export const updateSupplierItem =
  async (
    id: number,
    payload:
      UpdateSupplierItemPayload,
  ) =>
    jsonOrThrow<
      SupplierItem
    >(
      await apiClient(
        `/api/v1/catalogue/supplier-items/${id}`,
        {
          method: 'PATCH',

          body:
            JSON.stringify(
              payload,
            ),
        },
      ),
      'Unable to update supplier pricing.',
    )


// ============================================================
// CURRENCIES
// ============================================================

export const getCurrencies =
  async () =>
    jsonOrThrow<
      Currency[]
    >(
      await apiClient(
        '/api/v1/reference/currencies',
      ),
      'Unable to load currencies.',
    )


// ============================================================
// EXCHANGE RATES
// ============================================================

export const getLatestExchangeRate =
  async (
    fromCurrency: string,
    toCurrency: string = 'AUD',
  ) =>
    jsonOrThrow<ExchangeRate>(
      await apiClient(
        `/api/v1/reference/exchange-rates/latest?from_currency=${encodeURIComponent(
          fromCurrency,
        )}&to_currency=${encodeURIComponent(
          toCurrency,
        )}`,
      ),
      'Unable to load exchange rate.',
    )


// ============================================================
// TAX CODES
// ============================================================

export const getTaxCodes =
  async () =>
    jsonOrThrow<
      TaxCode[]
    >(
      await apiClient(
        '/api/v1/reference/tax-codes',
      ),
      'Unable to load tax codes.',
    )