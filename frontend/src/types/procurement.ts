// ============================================================
// NEXORA PROCUREMENT TYPES
// ============================================================


// ============================================================
// SUPPLIER
// ============================================================

export type Supplier = {
  supplier_id: number
  supplier_code: string
  supplier_name: string

  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null

  is_active: boolean

  created_at?: string
  updated_at?: string
}


// ============================================================
// ITEM CATEGORY
// ============================================================

export type ItemCategory = {
  category_id: number
  category_code: string
  category_name: string

  description?: string | null

  // Compatibility with existing CataloguePage
  active?: boolean

  is_active?: boolean

  created_at?: string
  updated_at?: string
}


// ============================================================
// UNIT OF MEASURE
// ============================================================

export type UnitOfMeasure = {
  uom_id: number
  uom_code: string
  uom_name: string

  uom_type?: string | null

  // Compatibility with existing CataloguePage
  active?: boolean

  is_active?: boolean

  created_at?: string
  updated_at?: string
}


// ============================================================
// CURRENCY
// ============================================================

export type Currency = {
  currency_id: number

  currency_code: string
  currency_name: string

  currency_symbol: string | null

  decimal_places: number

  is_base_currency: boolean
  is_active: boolean

  created_at: string
  updated_at: string
}


// ============================================================
// EXCHANGE RATE
// ============================================================

export type ExchangeRate = {
  exchange_rate_id: number

  from_currency_code: string
  to_currency_code: string

  exchange_rate: number

  effective_date: string

  rate_source: string | null

  is_active: boolean

  created_at: string
  updated_at: string
}


// ============================================================
// TAX CODE
// ============================================================

export type TaxCode = {
  tax_code_id: number

  tax_code: string
  tax_name: string

  tax_rate: number

  tax_type: string

  country_code: string | null

  recoverable_percentage: number

  is_active: boolean

  created_at: string
  updated_at: string
}


// ============================================================
// CATALOGUE ITEM
// ============================================================

export type CatalogueItem = {
  catalogue_item_id: number

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

  status: string

  created_by?: number
  updated_by?: number

  created_at?: string
  updated_at?: string

  category?: ItemCategory | null
  purchase_uom?: UnitOfMeasure | null
  stock_uom?: UnitOfMeasure | null
}


// ============================================================
// SUPPLIER ITEM / SUPPLIER PRICING
// ============================================================

export type SupplierItem = {
  supplier_item_id: number

  catalogue_item_id: number

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

  tax_code_id?: number | null

  created_by?: number
  updated_by?: number

  created_at?: string
  updated_at?: string

  supplier?: Supplier | null
}


// ============================================================
// PURCHASE REQUEST ITEM
// ============================================================

export type PurchaseRequestItem = {
  purchase_request_item_id: number

  purchase_request_id: number

  item_code: string | null

  description: string

  quantity: number

  unit_of_measure: string

  estimated_unit_price: number

  estimated_total: number

  notes: string | null
}


// ============================================================
// PURCHASE REQUEST
// ============================================================

export type PurchaseRequest = {
  purchase_request_id: number

  request_number: string

  requested_by_user_id: number

  department: string

  purpose: string

  priority: string

  status: string

  total_estimated_amount: number

  required_by_date: string | null

  created_at?: string
  updated_at?: string

  items: PurchaseRequestItem[]
}


// ============================================================
// PURCHASE ORDER ITEM
// ============================================================

export type PurchaseOrderItem = {
  purchase_order_item_id: number

  purchase_order_id: number

  item_code: string | null

  description: string

  quantity: number

  unit_of_measure: string

  unit_price: number

  // ----------------------------------------------------------
  // TAX
  // ----------------------------------------------------------

  tax_code_id: number | null

  tax_rate: number

  tax_amount: number

  // ----------------------------------------------------------
  // TOTAL
  // ----------------------------------------------------------

  line_total: number

  notes: string | null
}


// ============================================================
// PURCHASE ORDER
// ============================================================

export type PurchaseOrder = {
  purchase_order_id: number

  po_number: string

  supplier_id: number

  purchase_request_id: number | null

  created_by_user_id: number

  warehouse_id: number | null

  receiving_location_id: number | null

  status: string

  // ----------------------------------------------------------
  // TRANSACTION CURRENCY
  // ----------------------------------------------------------

  currency: string

  subtotal: number

  tax_amount: number

  total_amount: number

  // ----------------------------------------------------------
  // BASE CURRENCY / EXCHANGE RATE
  // ----------------------------------------------------------

  base_currency: string

  exchange_rate: number

  base_subtotal: number | null

  base_tax_amount: number | null

  base_total_amount: number | null

  // ----------------------------------------------------------
  // DELIVERY
  // ----------------------------------------------------------

  delivery_address: string | null

  notes: string | null

  expected_delivery_date: string | null

  created_at?: string
  updated_at?: string

  items: PurchaseOrderItem[]

  supplier?: Supplier | null
}


// ============================================================
// APPROVAL
// ============================================================

export type Approval = {
  approval_id: number

  document_type: string

  document_id: number

  approver_user_id: number

  approval_level: number

  status: string

  comments: string | null

  created_at?: string
  updated_at?: string
}


// ============================================================
// DOCUMENT STATUS HISTORY
// ============================================================

export type DocumentStatusHistory = {
  document_status_history_id: number

  document_type: string

  document_id: number

  old_status: string | null

  new_status: string

  changed_by_user_id?: number | null

  comments?: string | null

  created_at?: string
}


// ============================================================
// GOODS RECEIPT ITEM
// ============================================================

export type GoodsReceiptItem = {
  goods_receipt_item_id: number

  goods_receipt_id: number

  purchase_order_item_id: number

  item_code: string | null

  description: string

  ordered_quantity: number

  received_quantity: number

  rejected_quantity: number

  unit_of_measure: string

  notes: string | null
}


// ============================================================
// GOODS RECEIPT
// ============================================================

export type GoodsReceipt = {
  goods_receipt_id: number

  // Main receipt number used by the current UI
  receipt_number: string

  // Compatibility alias if needed elsewhere
  grn_number?: string

  purchase_order_id: number

  received_by_user_id: number

  delivery_reference: string | null

  notes: string | null

  status: string

  // Required because GoodsReceiptDetailsPage uses:
  // new Date(receipt.received_at)
  received_at: string

  created_at?: string
  updated_at?: string

  items: GoodsReceiptItem[]
}
// ============================================================
// INVENTORY BALANCE
// ============================================================

export type InventoryBalance = {
  inventory_balance_id: number

  catalogue_item_id: number

  item_code?: string | null

  warehouse_id?: number | null

  warehouse_location_id?: number | null

  // Existing InventoryPage field names
  on_hand_quantity: number

  available_quantity: number

  reserved_quantity?: number

  quarantine_quantity: number

  unit_of_measure: string

  last_transaction_at?: string | null

  created_at?: string
  updated_at?: string

  // Compatibility aliases
  quantity_on_hand?: number

  quantity_available?: number

  quantity_reserved?: number
}


// ============================================================
// INVENTORY TRANSACTION
// ============================================================

export type InventoryTransaction = {
  inventory_transaction_id: number

  catalogue_item_id: number

  item_code?: string | null

  transaction_type: string

  quantity: number

  unit_of_measure?: string

  warehouse_id?: number | null

  warehouse_location_id?: number | null

  // Existing InventoryPage field names
  reference_number?: string | null

  source_document_type?: string | null

  source_document_id?: number | null

  source_line_id?: number | null

  created_at: string

  notes?: string | null

  // Compatibility aliases
  reference_type?: string | null

  reference_id?: number | null
}


// ============================================================
// WAREHOUSE
// ============================================================

export type Warehouse = {
  warehouse_id: number

  warehouse_code: string

  warehouse_name: string

  warehouse_type?: string

  is_active?: boolean
}


// ============================================================
// WAREHOUSE LOCATION
// ============================================================

export type WarehouseLocation = {
  warehouse_location_id: number

  warehouse_id: number

  location_code: string

  location_name: string

  location_type?: string

  is_receiving_location: boolean

  is_quarantine_location?: boolean

  is_active?: boolean
}