import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createPurchaseOrder,
  getCatalogueItems,
  getCurrencies,
  getPurchaseRequests,
  getSuppliers,
  getSupplierItemsForCatalogueItem,
  getTaxCodes,
} from '../../api/procurementapi'

import type {
  CatalogueItem,
  Currency,
  PurchaseRequest,
  Supplier,
  TaxCode,
} from '../../types/procurement'

import {
  getReceivingLocations,
  getWarehouses,
} from '../../api/warehouseapi'

import type {
  Warehouse,
  WarehouseLocation,
} from '../../types/warehouse'


type PurchaseOrderCreatePageProps = {
  onCancel: () => void

  onCreated: (
    poNumber: string,
  ) => Promise<void> | void
}


type PurchaseOrderLineForm = {
  row_id: number

  catalogue_item_id: number

  item_code: string

  description: string

  quantity:
    number | null

  unit_of_measure: string

  unit_price:
    number | null

  tax_code_id:
    number | null

  notes: string
}


type PurchaseOrderForm = {
  supplier_id: number

  purchase_request_id:
    number | null

  warehouse_id:
    number | null

  receiving_location_id:
    number | null

  currency: string

  expected_delivery_date:
    string

  delivery_address:
    string

  notes: string

  items:
    PurchaseOrderLineForm[]
}


type PurchaseOrderHeaderErrors = {
  supplier_id?: string
  warehouse_id?: string
  receiving_location_id?: string
  currency?: string
}


type PurchaseOrderLineErrors = {
  catalogue_item_id?: string
  quantity?: string
  unit_of_measure?: string
  unit_price?: string
  tax_code_id?: string
}


type PurchaseOrderFieldErrors = {
  header: PurchaseOrderHeaderErrors
  lines: Record<number, PurchaseOrderLineErrors>
}


const createEmptyLine = (
  rowId: number,
): PurchaseOrderLineForm => ({
  row_id: rowId,

  catalogue_item_id: 0,

  item_code: '',

  description: '',

  quantity: null,

  unit_of_measure: '',

  unit_price: null,

  tax_code_id: null,

  notes: '',
})


const createEmptyForm =
  (): PurchaseOrderForm => ({
    supplier_id: 0,

    purchase_request_id:
      null,

    warehouse_id:
      null,

    receiving_location_id:
      null,

    currency: 'AUD',

    expected_delivery_date:
      '',

    delivery_address: '',

    notes: '',

    items: [
      createEmptyLine(1),
    ],
  })


function PurchaseOrderCreatePage({
  onCancel,
  onCreated,
}: PurchaseOrderCreatePageProps) {
  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    catalogueItems,
    setCatalogueItems,
  ] = useState<CatalogueItem[]>([])

  const [
    purchaseRequests,
    setPurchaseRequests,
  ] = useState<PurchaseRequest[]>([])

  const [
    warehouses,
    setWarehouses,
  ] = useState<Warehouse[]>([])

  const [
    receivingLocations,
    setReceivingLocations,
  ] = useState<WarehouseLocation[]>([])

  const [
    currencies,
    setCurrencies,
  ] = useState<Currency[]>([])

  const [
    taxCodes,
    setTaxCodes,
  ] = useState<TaxCode[]>([])

  const [
    isLoadingLocations,
    setIsLoadingLocations,
  ] = useState(false)

  const [
    form,
    setForm,
  ] = useState<PurchaseOrderForm>(
    createEmptyForm(),
  )

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState<PurchaseOrderFieldErrors>({
    header: {},
    lines: {},
  })


  const clearHeaderFieldError = (
    field: keyof PurchaseOrderHeaderErrors,
  ) => {
    setFieldErrors((current) => ({
      ...current,
      header: {
        ...current.header,
        [field]: undefined,
      },
    }))
  }


  const clearLineFieldError = (
    rowId: number,
    field: keyof PurchaseOrderLineErrors,
  ) => {
    setFieldErrors((current) => ({
      ...current,
      lines: {
        ...current.lines,
        [rowId]: {
          ...current.lines[rowId],
          [field]: undefined,
        },
      },
    }))
  }


  // ============================================================
  // LOAD MASTER DATA
  // ============================================================

  useEffect(() => {
    const loadReferenceData =
      async () => {
        try {
          setIsLoading(true)

          const [
            supplierData,
            catalogueData,
            requestData,
            warehouseData,
            currencyData,
            taxCodeData,
          ] = await Promise.all([
            getSuppliers(),

            getCatalogueItems(),

            getPurchaseRequests(),

            getWarehouses(),

            getCurrencies(),

            getTaxCodes(),
          ])

          setSuppliers(
            supplierData.filter(
              (supplier) =>
                supplier.is_active,
            ),
          )

          setCatalogueItems(
            catalogueData.filter(
              (item) =>
                item.status ===
                'ACTIVE',
            ),
          )

          setPurchaseRequests(
            requestData,
          )

          setWarehouses(
            warehouseData.filter(
              (warehouse) =>
                warehouse.is_active,
            ),
          )

          setCurrencies(
            currencyData.filter(
              (currency) =>
                currency.is_active,
            ),
          )

          setTaxCodes(
            taxCodeData.filter(
              (taxCode) =>
                taxCode.is_active,
            ),
          )
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load purchase order reference data.',
          )
        } finally {
          setIsLoading(false)
        }
      }

    void loadReferenceData()
  }, [])


  // ============================================================
  // WAREHOUSE / RECEIVING LOCATION
  // ============================================================

  const handleWarehouseChange = async (
    warehouseId: number,
  ) => {
    setError('')
    clearHeaderFieldError('warehouse_id')
    clearHeaderFieldError('receiving_location_id')

    setForm((current) => ({
      ...current,
      warehouse_id:
        warehouseId > 0
          ? warehouseId
          : null,
      receiving_location_id:
        null,
    }))

    setReceivingLocations([])

    if (warehouseId <= 0) {
      return
    }

    try {
      setIsLoadingLocations(true)

      const locationData =
        await getReceivingLocations(
          warehouseId,
        )

      setReceivingLocations(
        locationData,
      )
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : 'Unable to load receiving locations.',
      )
    } finally {
      setIsLoadingLocations(false)
    }
  }


  // ============================================================
  // UOM LOOKUP
  // ============================================================

  const getCatalogueUomCode = (
    item: CatalogueItem,
  ) => {
    const knownUoms:
      Record<number, string> =
      {
        1: 'EA',
        2: 'BOX',
        3: 'CTN',
        4: 'PK',
        5: 'KG',
        6: 'G',
        7: 'T',
        8: 'L',
        9: 'ML',
      }

    return (
      knownUoms[
        item.purchase_uom_id
      ] ?? 'EA'
    )
  }


  // ============================================================
  // LINE UPDATE
  // ============================================================

  const updateLine = (
    rowId: number,

    updates:
      Partial<PurchaseOrderLineForm>,
  ) => {
    setForm((current) => ({
      ...current,

      items:
        current.items.map(
          (line) =>
            line.row_id ===
            rowId
              ? {
                  ...line,
                  ...updates,
                }
              : line,
        ),
    }))
  }


  // ============================================================
  // SUPPLIER CHANGE
  // ============================================================

  const handleSupplierChange = (
    supplierId: number,
  ) => {
    setError('')
    clearHeaderFieldError('supplier_id')
    setFieldErrors((current) => ({
      ...current,
      lines: {},
    }))

    setForm((current) => ({
      ...current,

      supplier_id:
        supplierId,

      /*
       * Clear previous item/pricing selections
       * because catalogue pricing is supplier-specific.
       */
      items:
        current.items.map(
          (line) =>
            createEmptyLine(
              line.row_id,
            ),
        ),
    }))
  }


  // ============================================================
  // CATALOGUE SELECTION
  // ============================================================

  const handleCatalogueChange =
    async (
      rowId: number,

      catalogueItemId:
        number,
    ) => {
      setError('')
      clearLineFieldError(
        rowId,
        'catalogue_item_id',
      )
      clearLineFieldError(
        rowId,
        'unit_of_measure',
      )
      clearLineFieldError(
        rowId,
        'unit_price',
      )

      if (
        form.supplier_id <= 0
      ) {
        setError(
          'Please select the supplier first.',
        )

        return
      }

      if (
        catalogueItemId <= 0
      ) {
        updateLine(
          rowId,
          createEmptyLine(
            rowId,
          ),
        )

        return
      }

      const selectedItem =
        catalogueItems.find(
          (item) =>
            item.catalogue_item_id ===
            catalogueItemId,
        )

      if (!selectedItem) {
        return
      }

      updateLine(
        rowId,
        {
          catalogue_item_id:
            selectedItem.catalogue_item_id,

          item_code:
            selectedItem.item_code,

          description:
            selectedItem.item_name,

          unit_of_measure:
            getCatalogueUomCode(
              selectedItem,
            ),

          unit_price:
            null,
        },
      )


      try {
        const pricing =
          await getSupplierItemsForCatalogueItem(
            selectedItem.catalogue_item_id,
          )

        const supplierPrice =
          pricing.find(
            (price) =>
              Number(
                price.supplier_id,
              ) ===
              Number(
                form.supplier_id,
              ),
          )

        if (!supplierPrice) {
          updateLine(
            rowId,
            {
              unit_price:
                null,
            },
          )

          setFieldErrors(
            (current) => ({
              ...current,

              lines: {
                ...current.lines,

                [rowId]: {
                  ...current.lines[
                    rowId
                  ],

                  unit_price:
                    'No current supplier pricing exists for this supplier and catalogue item.',
                },
              },
            }),
          )

          setError(
            `No current supplier pricing exists for ${selectedItem.item_name} and the selected supplier. Configure supplier pricing in Catalogue before creating the purchase order.`,
          )

          return
        }

        updateLine(
          rowId,
          {
            unit_price:
              Number(
                supplierPrice.unit_price,
              ),

            tax_code_id:
              supplierPrice.tax_code_id ??
              null,
          },
        )

        clearLineFieldError(
          rowId,
          'unit_price',
        )
      } catch (pricingError) {
        setError(
          pricingError instanceof Error
            ? pricingError.message
            : 'Unable to retrieve supplier pricing.',
        )
      }
    }


  // ============================================================
  // LINES
  // ============================================================

  const handleAddLine = () => {
    setForm((current) => {
      const highestId =
        current.items.reduce(
          (
            highest,
            line,
          ) =>
            Math.max(
              highest,
              line.row_id,
            ),
          0,
        )

      return {
        ...current,

        items: [
          ...current.items,

          createEmptyLine(
            highestId + 1,
          ),
        ],
      }
    })
  }


  const handleRemoveLine = (
    rowId: number,
  ) => {
    setForm((current) => {
      if (
        current.items.length <=
        1
      ) {
        return current
      }

      return {
        ...current,

        items:
          current.items.filter(
            (line) =>
              line.row_id !==
              rowId,
          ),
      }
    })
    setFieldErrors((current) => {
      const nextLines = {
        ...current.lines,
      }

      delete nextLines[rowId]

      return {
        ...current,
        lines: nextLines,
      }
    })
  }


  // ============================================================
  // TOTALS
  // ============================================================

  const calculateLineSubtotal = (
    line:
      PurchaseOrderLineForm,
  ) => {
    return (
      (
        line.quantity ??
        0
      ) *
      (
        line.unit_price ??
        0
      )
    )
  }


  const calculateLineTax = (
    line:
      PurchaseOrderLineForm,
  ) => {
    const selectedTaxCode =
      taxCodes.find(
        (taxCode) =>
          taxCode.tax_code_id ===
          line.tax_code_id,
      )

    const taxRate =
      selectedTaxCode
        ? Number(
            selectedTaxCode.tax_rate,
          )
        : 0

    return (
      calculateLineSubtotal(
        line,
      ) *
      taxRate /
      100
    )
  }


  const calculateLineTotal = (
    line:
      PurchaseOrderLineForm,
  ) => {
    return (
      calculateLineSubtotal(
        line,
      ) +
      calculateLineTax(
        line,
      )
    )
  }


  const subtotal =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          calculateLineSubtotal(
            line,
          ),
        0,
      )
    }, [form.items])


  const totalTax =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          calculateLineTax(
            line,
          ),
        0,
      )
    }, [form.items, taxCodes])


  const grandTotal =
    subtotal +
    totalTax


  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')

    const nextErrors:
      PurchaseOrderFieldErrors = {
        header: {},
        lines: {},
      }

    if (form.supplier_id <= 0) {
      nextErrors.header.supplier_id =
        'Supplier is required.'
    }

    if (form.warehouse_id === null) {
      nextErrors.header.warehouse_id =
        'Delivery warehouse is required.'
    }

    if (
      form.receiving_location_id ===
      null
    ) {
      nextErrors.header.receiving_location_id =
        'Receiving location is required.'
    }

    if (!form.currency.trim()) {
      nextErrors.header.currency =
        'Currency is required.'
    }

    for (const line of form.items) {
      const lineErrors:
        PurchaseOrderLineErrors = {}

      if (
        line.catalogue_item_id <= 0
      ) {
        lineErrors.catalogue_item_id =
          'Catalogue item is required.'
      }

      if (
        line.quantity === null ||
        line.quantity <= 0
      ) {
        lineErrors.quantity =
          'Quantity must be greater than zero.'
      }

      if (!line.unit_of_measure.trim()) {
        lineErrors.unit_of_measure =
          'Purchase UOM is required.'
      }

      if (
        line.unit_price === null ||
        line.unit_price <= 0
      ) {
        lineErrors.unit_price =
          'A valid supplier price is required.'
      }

      if (line.tax_code_id === null) {
        lineErrors.tax_code_id =
          'Tax code is required.'
      }

      if (
        Object.keys(lineErrors).length >
        0
      ) {
        nextErrors.lines[line.row_id] =
          lineErrors
      }
    }

    setFieldErrors(nextErrors)

    const validationCount =
      Object.keys(nextErrors.header).length +
      Object.values(nextErrors.lines)
        .reduce(
          (total, lineErrors) =>
            total +
            Object.keys(lineErrors).length,
          0,
        )

    if (validationCount > 0) {
      setError(
        `Please correct ${validationCount} highlighted field${
          validationCount === 1 ? '' : 's'
        } before continuing.`,
      )

      let firstField: string | null =
        null

      if (
        nextErrors.header.supplier_id
      ) {
        firstField = 'supplier_id'
      } else if (
        nextErrors.header.warehouse_id
      ) {
        firstField = 'warehouse_id'
      } else if (
        nextErrors.header.receiving_location_id
      ) {
        firstField =
          'receiving_location_id'
      } else if (
        nextErrors.header.currency
      ) {
        firstField = 'currency'
      } else {
        const firstLine =
          Object.entries(
            nextErrors.lines,
          )[0]

        if (firstLine) {
          const [rowId, errors] =
            firstLine

          const firstLineField =
            Object.keys(errors)[0]

          if (firstLineField) {
            firstField =
              `line-${rowId}-${firstLineField}`
          }
        }
      }

      if (firstField) {
        window.requestAnimationFrame(
          () => {
            const element =
              document.querySelector(
                `[data-po-field="${firstField}"]`,
              ) as HTMLElement | null

            element?.focus()
          },
        )
      }

      return
    }

    try {
      setIsSaving(true)

      const createdOrder =
        await createPurchaseOrder(
          {
            supplier_id:
              form.supplier_id,

            purchase_request_id:
              form.purchase_request_id,

            created_by_user_id:
              1,

            warehouse_id:
              form.warehouse_id,

            receiving_location_id:
              form.receiving_location_id,

            currency:
              form.currency
                .trim()
                .toUpperCase(),

            delivery_address:
              form.delivery_address
                .trim() ||
              null,

            notes:
              form.notes
                .trim() ||
              null,

            expected_delivery_date:
              form.expected_delivery_date
                ? `${form.expected_delivery_date}T00:00:00`
                : null,

            items:
              form.items.map(
                (line) => ({
                  item_code:
                    line.item_code ||
                    null,

                  description:
                    line.description,

                  quantity:
                    line.quantity as number,

                  unit_of_measure:
                    line.unit_of_measure,

                  unit_price:
                    line.unit_price as number,

                  tax_code_id:
                    line.tax_code_id as number,

                  notes:
                    line.notes
                      .trim() ||
                    null,
                }),
              ),
          },
        )

      setFieldErrors({
        header: {},
        lines: {},
      })

      await onCreated(
        createdOrder.po_number,
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to create purchase order.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <section className="management-page">
        <p>
          Loading purchase order
          data...
        </p>
      </section>
    )
  }


  // ============================================================
  // FULL PAGE UI
  // ============================================================

  return (
    <section className="management-page">
      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            PROCUREMENT / PURCHASE ORDERS
          </p>

          <h1>
            New Purchase Order
          </h1>

          <p>
            Create a supplier purchase
            order using catalogue items
            and supplier-specific pricing.
          </p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={onCancel}
          >
            ← Back to Purchase Orders
          </button>
        </div>
      </div>


      {error && (
        <div
          className="page-message error"
          role="alert"
        >
          {error}
        </div>
      )}


      <form
        className="enterprise-form"
        noValidate
        onSubmit={
          handleSubmit
        }
      >

        {/* ======================================================
            PO HEADER
        ====================================================== */}

        <div className="data-table-card">
          <div
            style={{
              padding: '24px',
            }}
          >
            <p className="eyebrow">
              PO HEADER
            </p>

            <h2>
              Purchase Order Details
            </h2>


            <div className="form-grid">

              <label>
                Supplier *

                <select
                  data-po-field="supplier_id"
                  className={
                    fieldErrors.header.supplier_id
                      ? 'field-error'
                      : ''
                  }
                  value={
                    form.supplier_id
                  }
                  onChange={(
                    event,
                  ) =>
                    handleSupplierChange(
                      Number(
                        event.target
                          .value,
                      ),
                    )
                  }
                >
                  <option value={0}>
                    Select supplier
                  </option>

                  {suppliers.map(
                    (supplier) => (
                      <option
                        key={
                          supplier.supplier_id
                        }
                        value={
                          supplier.supplier_id
                        }
                      >
                        {
                          supplier.supplier_code
                        }{' '}
                        —{' '}
                        {
                          supplier.supplier_name
                        }
                      </option>
                    ),
                  )}
                </select>

                {fieldErrors.header.supplier_id && (
                  <span className="field-error-message">
                    {fieldErrors.header.supplier_id}
                  </span>
                )}
              </label>


              <label>
                Source Purchase Request

                <select
                  value={
                    form.purchase_request_id ??
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      purchase_request_id:
                        event.target
                          .value
                          ? Number(
                              event
                                .target
                                .value,
                            )
                          : null,
                    })
                  }
                >
                  <option value="">
                    Direct PO / No PR
                  </option>

                  {purchaseRequests.map(
                    (request) => (
                      <option
                        key={
                          request.purchase_request_id
                        }
                        value={
                          request.purchase_request_id
                        }
                      >
                        {
                          request.request_number
                        }{' '}
                        —{' '}
                        {
                          request.department
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>


              <label>
                Delivery Warehouse *

                <select
                  data-po-field="warehouse_id"
                  className={
                    fieldErrors.header.warehouse_id
                      ? 'field-error'
                      : ''
                  }
                  value={
                    form.warehouse_id ??
                    ''
                  }
                  onChange={(
                    event,
                  ) =>
                    void handleWarehouseChange(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                >
                  <option value="">
                    Select warehouse
                  </option>

                  {warehouses.map(
                    (warehouse) => (
                      <option
                        key={
                          warehouse.warehouse_id
                        }
                        value={
                          warehouse.warehouse_id
                        }
                      >
                        {
                          warehouse.warehouse_code
                        }{' '}
                        —{' '}
                        {
                          warehouse.warehouse_name
                        }
                      </option>
                    ),
                  )}
                </select>

                {fieldErrors.header.warehouse_id && (
                  <span className="field-error-message">
                    {fieldErrors.header.warehouse_id}
                  </span>
                )}
              </label>


              <label>
                Receiving Location *

                <select
                  data-po-field="receiving_location_id"
                  className={
                    fieldErrors.header.receiving_location_id
                      ? 'field-error'
                      : ''
                  }
                  disabled={
                    !form.warehouse_id ||
                    isLoadingLocations
                  }
                  value={
                    form.receiving_location_id ??
                    ''
                  }
                  onChange={(
                    event,
                  ) => {
                    clearHeaderFieldError(
                      'receiving_location_id',
                    )

                    setForm((current) => ({
                      ...current,
                      receiving_location_id:
                        event.target.value
                          ? Number(
                              event.target.value,
                            )
                          : null,
                    }))
                  }}
                >
                  <option value="">
                    {isLoadingLocations
                      ? 'Loading locations...'
                      : form.warehouse_id
                        ? 'Select receiving location'
                        : 'Select warehouse first'}
                  </option>

                  {receivingLocations.map(
                    (location) => (
                      <option
                        key={
                          location.warehouse_location_id
                        }
                        value={
                          location.warehouse_location_id
                        }
                      >
                        {
                          location.location_code
                        }{' '}
                        —{' '}
                        {
                          location.location_name
                        }
                      </option>
                    ),
                  )}
                </select>

                {fieldErrors.header.receiving_location_id && (
                  <span className="field-error-message">
                    {fieldErrors.header.receiving_location_id}
                  </span>
                )}
              </label>


              <label>
                Currency *

                <select
                  data-po-field="currency"
                  className={
                    fieldErrors.header.currency
                      ? 'field-error'
                      : ''
                  }
                  value={
                    form.currency
                  }
                  onChange={(
                    event,
                  ) => {
                    clearHeaderFieldError(
                      'currency',
                    )

                    setForm({
                      ...form,

                      currency:
                        event.target.value,
                    })
                  }}
                >
                  <option value="">
                    Select currency
                  </option>

                  {currencies.map(
                    (currency) => (
                      <option
                        key={
                          currency.currency_id
                        }
                        value={
                          currency.currency_code
                        }
                      >
                        {
                          currency.currency_code
                        }{' '}
                        —{' '}
                        {
                          currency.currency_name
                        }
                      </option>
                    ),
                  )}
                </select>

                {fieldErrors.header.currency && (
                  <span className="field-error-message">
                    {fieldErrors.header.currency}
                  </span>
                )}
              </label>


              <label>
                Expected Delivery

                <input
                  type="date"
                  value={
                    form.expected_delivery_date
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      expected_delivery_date:
                        event.target
                          .value,
                    })
                  }
                />
              </label>


              <label className="form-field-full">
                Delivery Address

                <input
                  type="text"
                  placeholder="Enter delivery location"
                  value={
                    form.delivery_address
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      delivery_address:
                        event.target
                          .value,
                    })
                  }
                />
              </label>


              <label className="form-field-full">
                PO Notes

                <textarea
                  rows={3}
                  placeholder="Purchase order notes"
                  value={
                    form.notes
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,

                      notes:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

            </div>
          </div>
        </div>


        {/* ======================================================
            ORDER LINES
        ====================================================== */}

        <div
          className="data-table-card"
          style={{
            marginTop: '24px',
          }}
        >
          <div
            style={{
              padding: '24px',
            }}
          >
            <div className="pr-lines-header">
              <div>
                <p className="eyebrow">
                  ORDER ITEMS
                </p>

                <h2>
                  Purchase Order Lines
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#71869d',
                    fontSize: '12px',
                  }}
                >
                  Add catalogue items and review
                  supplier pricing, tax and line totals.
                </p>
              </div>

              <button
                type="button"
                className="secondary-action-button"
                onClick={handleAddLine}
              >
                + Add Line
              </button>
            </div>

            <div
              style={{
                marginTop: '18px',
                overflowX: 'auto',
                border: '1px solid #d9e2ec',
                borderRadius: '12px',
              }}
            >
              <table
                className="enterprise-table"
                style={{
                  minWidth: '1180px',
                  margin: 0,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: '54px' }}>
                      #
                    </th>

                    <th style={{ minWidth: '330px' }}>
                      Catalogue Item *
                    </th>

                    <th style={{ width: '110px' }}>
                      Qty *
                    </th>

                    <th style={{ width: '90px' }}>
                      UOM *
                    </th>

                    <th style={{ width: '140px' }}>
                      Unit Price *
                    </th>

                    <th style={{ minWidth: '190px' }}>
                      Tax Code *
                    </th>

                    <th style={{ width: '120px' }}>
                      Tax
                    </th>

                    <th style={{ width: '140px' }}>
                      Line Total
                    </th>

                    <th
                      style={{
                        width: '88px',
                        textAlign: 'center',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {form.items.map(
                    (
                      line,
                      index,
                    ) => {
                      const selectedTaxCode =
                        taxCodes.find(
                          (taxCode) =>
                            taxCode.tax_code_id ===
                            line.tax_code_id,
                        )

                      return (
                        <Fragment
                          key={
                            line.row_id
                          }
                        >
                          <tr
                            style={{
                              verticalAlign:
                                'top',
                            }}
                          >
                            <td>
                              <strong>
                                {index + 1}
                              </strong>
                            </td>

                            <td>
                              <select
                                data-po-field={`line-${line.row_id}-catalogue_item_id`}
                                className={
                                  fieldErrors.lines[
                                    line.row_id
                                  ]?.catalogue_item_id
                                    ? 'field-error'
                                    : ''
                                }
                                value={
                                  line.catalogue_item_id
                                }
                                onChange={(
                                  event,
                                ) =>
                                  void handleCatalogueChange(
                                    line.row_id,
                                    Number(
                                      event.target.value,
                                    ),
                                  )
                                }
                                style={{
                                  width:
                                    '100%',
                                }}
                              >
                                <option value={0}>
                                  Select catalogue item
                                </option>

                                {catalogueItems.map(
                                  (item) => (
                                    <option
                                      key={
                                        item.catalogue_item_id
                                      }
                                      value={
                                        item.catalogue_item_id
                                      }
                                    >
                                      {
                                        item.item_code
                                      }{' '}
                                      —{' '}
                                      {
                                        item.item_name
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              {fieldErrors.lines[
                                line.row_id
                              ]?.catalogue_item_id && (
                                <span className="field-error-message">
                                  {
                                    fieldErrors.lines[
                                      line.row_id
                                    ]?.catalogue_item_id
                                  }
                                </span>
                              )}

                              {line.catalogue_item_id >
                                0 && (
                                <div
                                  style={{
                                    marginTop:
                                      '7px',
                                    color:
                                      '#486581',
                                    fontSize:
                                      '11px',
                                    lineHeight:
                                      1.45,
                                  }}
                                >
                                  <div>
                                    <strong>
                                      {
                                        line.item_code
                                      }
                                    </strong>
                                  </div>

                                  <div>
                                    {
                                      line.description
                                    }
                                  </div>
                                </div>
                              )}
                            </td>

                            <td>
                              <input
                                data-po-field={`line-${line.row_id}-quantity`}
                                type="number"
                                min="0.0001"
                                step="0.0001"
                                className={
                                  fieldErrors.lines[
                                    line.row_id
                                  ]?.quantity
                                    ? 'field-error'
                                    : ''
                                }
                                value={
                                  line.quantity ??
                                  ''
                                }
                                onChange={(
                                  event,
                                ) => {
                                  clearLineFieldError(
                                    line.row_id,
                                    'quantity',
                                  )

                                  updateLine(
                                    line.row_id,
                                    {
                                      quantity:
                                        event.target.value ===
                                        ''
                                          ? null
                                          : Number(
                                              event.target.value,
                                            ),
                                    },
                                  )
                                }}
                                style={{
                                  width:
                                    '100%',
                                }}
                              />

                              {fieldErrors.lines[
                                line.row_id
                              ]?.quantity && (
                                <span className="field-error-message">
                                  {
                                    fieldErrors.lines[
                                      line.row_id
                                    ]?.quantity
                                  }
                                </span>
                              )}
                            </td>

                            <td>
                              <input
                                data-po-field={`line-${line.row_id}-unit_of_measure`}
                                type="text"
                                readOnly
                                className={
                                  fieldErrors.lines[
                                    line.row_id
                                  ]?.unit_of_measure
                                    ? 'field-error'
                                    : ''
                                }
                                value={
                                  line.unit_of_measure
                                }
                                style={{
                                  width:
                                    '100%',
                                }}
                              />

                              {fieldErrors.lines[
                                line.row_id
                              ]?.unit_of_measure && (
                                <span className="field-error-message">
                                  {
                                    fieldErrors.lines[
                                      line.row_id
                                    ]?.unit_of_measure
                                  }
                                </span>
                              )}
                            </td>

                            <td>
                              <input
                                data-po-field={`line-${line.row_id}-unit_price`}
                                type="number"
                                readOnly
                                className={
                                  fieldErrors.lines[
                                    line.row_id
                                  ]?.unit_price
                                    ? 'field-error'
                                    : ''
                                }
                                value={
                                  line.unit_price ??
                                  ''
                                }
                                style={{
                                  width:
                                    '100%',
                                }}
                              />

                              {fieldErrors.lines[
                                line.row_id
                              ]?.unit_price && (
                                <span className="field-error-message">
                                  {
                                    fieldErrors.lines[
                                      line.row_id
                                    ]?.unit_price
                                  }
                                </span>
                              )}

                              {!fieldErrors.lines[
                                line.row_id
                              ]?.unit_price &&
                                line.catalogue_item_id >
                                  0 && (
                                <small
                                  style={{
                                    display:
                                      'block',
                                    marginTop:
                                      '5px',
                                    color:
                                      '#829ab1',
                                    lineHeight:
                                      1.35,
                                  }}
                                >
                                  Supplier pricing
                                </small>
                              )}
                            </td>

                            <td>
                              <select
                                data-po-field={`line-${line.row_id}-tax_code_id`}
                                className={
                                  fieldErrors.lines[
                                    line.row_id
                                  ]?.tax_code_id
                                    ? 'field-error'
                                    : ''
                                }
                                value={
                                  line.tax_code_id ??
                                  ''
                                }
                                onChange={(
                                  event,
                                ) => {
                                  clearLineFieldError(
                                    line.row_id,
                                    'tax_code_id',
                                  )

                                  updateLine(
                                    line.row_id,
                                    {
                                      tax_code_id:
                                        event.target.value ===
                                        ''
                                          ? null
                                          : Number(
                                              event.target.value,
                                            ),
                                    },
                                  )
                                }}
                                style={{
                                  width:
                                    '100%',
                                }}
                              >
                                <option value="">
                                  Select tax code
                                </option>

                                {taxCodes.map(
                                  (taxCode) => (
                                    <option
                                      key={
                                        taxCode.tax_code_id
                                      }
                                      value={
                                        taxCode.tax_code_id
                                      }
                                    >
                                      {
                                        taxCode.tax_code
                                      }{' '}
                                      —{' '}
                                      {
                                        taxCode.tax_name
                                      }{' '}
                                      (
                                      {Number(
                                        taxCode.tax_rate,
                                      ).toFixed(
                                        2,
                                      )}
                                      %)
                                    </option>
                                  ),
                                )}
                              </select>

                              {fieldErrors.lines[
                                line.row_id
                              ]?.tax_code_id && (
                                <span className="field-error-message">
                                  {
                                    fieldErrors.lines[
                                      line.row_id
                                    ]?.tax_code_id
                                  }
                                </span>
                              )}

                              {selectedTaxCode && (
                                <div
                                  style={{
                                    marginTop:
                                      '6px',
                                    color:
                                      '#627d98',
                                    fontSize:
                                      '11px',
                                  }}
                                >
                                  Rate:{' '}
                                  {Number(
                                    selectedTaxCode.tax_rate,
                                  ).toFixed(
                                    2,
                                  )}
                                  %
                                </div>
                              )}
                            </td>

                            <td>
                              <div
                                style={{
                                  fontWeight:
                                    700,
                                  color:
                                    '#243b53',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                {form.currency}{' '}
                                {calculateLineTax(
                                  line,
                                ).toFixed(
                                  2,
                                )}
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    '6px',
                                  color:
                                    '#829ab1',
                                  fontSize:
                                    '11px',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                Subtotal{' '}
                                {form.currency}{' '}
                                {calculateLineSubtotal(
                                  line,
                                ).toFixed(
                                  2,
                                )}
                              </div>
                            </td>

                            <td>
                              <strong
                                style={{
                                  display:
                                    'block',
                                  fontSize:
                                    '14px',
                                  whiteSpace:
                                    'nowrap',
                                }}
                              >
                                {form.currency}{' '}
                                {calculateLineTotal(
                                  line,
                                ).toFixed(
                                  2,
                                )}
                              </strong>
                            </td>

                            <td
                              style={{
                                textAlign:
                                  'center',
                              }}
                            >
                              <button
                                type="button"
                                className="table-action-button"
                                disabled={
                                  form.items.length <=
                                  1
                                }
                                onClick={() =>
                                  handleRemoveLine(
                                    line.row_id,
                                  )
                                }
                                title={
                                  form.items.length <=
                                  1
                                    ? 'At least one line is required.'
                                    : 'Remove line'
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>

                          <tr
                            style={{
                              background:
                                '#fbfdff',
                            }}
                          >
                            <td />

                            <td colSpan={8}>
                              <div
                                style={{
                                  display:
                                    'grid',
                                  gridTemplateColumns:
                                    '90px minmax(0, 1fr)',
                                  alignItems:
                                    'center',
                                  gap:
                                    '10px',
                                  padding:
                                    '4px 0',
                                }}
                              >
                                <span
                                  style={{
                                    color:
                                      '#627d98',
                                    fontSize:
                                      '11px',
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  Line Notes
                                </span>

                                <input
                                  type="text"
                                  placeholder="Optional notes for this line"
                                  value={
                                    line.notes
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateLine(
                                      line.row_id,
                                      {
                                        notes:
                                          event.target.value,
                                      },
                                    )
                                  }
                                  style={{
                                    width:
                                      '100%',
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      )
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap:
                  '16px',
                marginTop:
                  '14px',
                flexWrap:
                  'wrap',
              }}
            >
              <span
                style={{
                  color:
                    '#71869d',
                  fontSize:
                    '12px',
                }}
              >
                {form.items.length}{' '}
                {form.items.length ===
                1
                  ? 'line'
                  : 'lines'}{' '}
                in this purchase order.
              </span>

              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  handleAddLine
                }
              >
                + Add Another Line
              </button>
            </div>
          </div>
        </div>


        {/* ======================================================
            TOTALS
        ====================================================== */}

        <div
          className="data-table-card"
          style={{
            marginTop: '24px',
          }}
        >
          <div
            style={{
              padding: '24px',
            }}
          >
            <p className="eyebrow">
              ORDER SUMMARY
            </p>

            <div className="po-summary-card">

              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  {form.currency}{' '}
                  {subtotal.toFixed(
                    2,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Tax
                </span>

                <strong>
                  {form.currency}{' '}
                  {totalTax.toFixed(
                    2,
                  )}
                </strong>
              </div>


              <div>
                <span>
                  PO Total
                </span>

                <strong>
                  {form.currency}{' '}
                  {grandTotal.toFixed(
                    2,
                  )}
                </strong>
              </div>

            </div>
          </div>
        </div>


        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div
          className="form-actions"
          style={{
            marginTop:
              '24px',

            marginBottom:
              '40px',
          }}
        >
          <button
            type="button"
            className="secondary-action-button"
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-action-button"
            disabled={
              isSaving
            }
          >
            {isSaving
              ? 'Creating Purchase Order...'
              : 'Save Draft PO'}
          </button>
        </div>

      </form>
    </section>
  )
}


export default PurchaseOrderCreatePage