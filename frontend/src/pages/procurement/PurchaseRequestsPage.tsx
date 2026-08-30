import {
  
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createPurchaseRequest,
  getCatalogueItems,
  getPurchaseRequests,
  getSupplierItemsForCatalogueItem,
} from '../../api/procurementapi'

import type {
  CatalogueItem,
  PurchaseRequest,
} from '../../types/procurement'


type PurchaseRequestLineForm = {
  row_id: number
  catalogue_item_id: number
  item_code: string
  description: string
  quantity: number | null
  unit_of_measure: string
  estimated_unit_price: number | null
  notes: string
}


type PurchaseRequestForm = {
  department: string
  purpose: string
  priority: string
  required_by_date: string
  items: PurchaseRequestLineForm[]
}


type PurchaseRequestHeaderErrors = {
  department?: string
  priority?: string
  purpose?: string
}


type PurchaseRequestLineErrors = {
  catalogue_item_id?: string
  quantity?: string
  unit_of_measure?: string
  estimated_unit_price?: string
}


type PurchaseRequestFieldErrors = {
  header: PurchaseRequestHeaderErrors
  lines: Record<
    number,
    PurchaseRequestLineErrors
  >
}


const createEmptyLine = (
  rowId: number,
): PurchaseRequestLineForm => ({
  row_id: rowId,
  catalogue_item_id: 0,
  item_code: '',
  description: '',
  quantity: null,
  unit_of_measure: '',
  estimated_unit_price: null,
  notes: '',
})


const createEmptyForm = (): PurchaseRequestForm => ({
  department: '',
  purpose: '',
  priority: 'NORMAL',
  required_by_date: '',
  items: [
    createEmptyLine(1),
  ],
})


function PurchaseRequestsPage() {
  const [
    purchaseRequests,
    setPurchaseRequests,
  ] = useState<PurchaseRequest[]>([])

  const [
    catalogueItems,
    setCatalogueItems,
  ] = useState<CatalogueItem[]>([])

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false)

  const [
    form,
    setForm,
  ] = useState<PurchaseRequestForm>(
    createEmptyForm(),
  )

  const [
    search,
    setSearch,
  ] = useState('')

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
    successMessage,
    setSuccessMessage,
  ] = useState('')


  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState<PurchaseRequestFieldErrors>({
      header: {},
      lines: {},
    })


  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [
        requestData,
        catalogueData,
      ] = await Promise.all([
        getPurchaseRequests(),
        getCatalogueItems(),
      ])

      setPurchaseRequests(
        requestData,
      )

      setCatalogueItems(
        catalogueData.filter(
          (item) =>
            item.status === 'ACTIVE',
        ),
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load purchase requests.',
      )
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    void loadData()
  }, [])


  // ============================================================
  // FILTER
  // ============================================================

  const filteredRequests =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return purchaseRequests
      }

      return purchaseRequests.filter(
        (request) =>
          [
            request.request_number,
            request.department,
            request.purpose,
            request.priority,
            request.status,
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          ),
      )
    }, [
      purchaseRequests,
      search,
    ])


  // ============================================================
  // TOTALS
  // ============================================================

  const calculateLineTotal = (
    line: PurchaseRequestLineForm,
  ) => {
    const quantity =
      line.quantity ?? 0

    const unitPrice =
      line.estimated_unit_price ??
      0

    return (
      quantity *
      unitPrice
    )
  }


  const requestTotal =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          calculateLineTotal(
            line,
          ),
        0,
      )
    }, [form.items])


  // ============================================================
  // FORM
  // ============================================================

  const handleNewRequest = () => {
    setForm(
      createEmptyForm(),
    )

    setError('')
    setSuccessMessage('')
    setFieldErrors({
      header: {},
      lines: {},
    })
    setShowCreateForm(true)
  }


  const handleCloseForm = () => {
    setShowCreateForm(false)
    setForm(
      createEmptyForm(),
    )
    setError('')
    setFieldErrors({
      header: {},
      lines: {},
    })
  }


  const clearHeaderFieldError = (
    field:
      keyof PurchaseRequestHeaderErrors,
  ) => {
    setFieldErrors(
      (current) => ({
        ...current,
        header: {
          ...current.header,
          [field]: undefined,
        },
      }),
    )
  }


  const clearLineFieldError = (
    rowId: number,
    field:
      keyof PurchaseRequestLineErrors,
  ) => {
    setFieldErrors(
      (current) => ({
        ...current,
        lines: {
          ...current.lines,
          [rowId]: {
            ...current.lines[rowId],
            [field]: undefined,
          },
        },
      }),
    )
  }


  const updateLine = (
    rowId: number,
    updates: Partial<PurchaseRequestLineForm>,
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
  // CATALOGUE SELECTION
  // ============================================================

  const handleCatalogueChange =
    async (
      rowId: number,
      catalogueItemId: number,
    ) => {
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
        'estimated_unit_price',
      )

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
            '',

          estimated_unit_price:
            null,
        },
      )

      try {
        const supplierPricing =
          await getSupplierItemsForCatalogueItem(
            selectedItem.catalogue_item_id,
          )

        const activePricing =
          supplierPricing.filter(
            (price) =>
              price.active,
          )

        const preferredPricing =
          activePricing.find(
            (price) =>
              price.preferred_supplier,
          ) ??
          activePricing[0]

        if (preferredPricing) {
         

          updateLine(
            rowId,
            {
              unit_of_measure:
                getCatalogueUomCode(
                  selectedItem,
                ),

              estimated_unit_price:
                Number(
                  preferredPricing.unit_price,
                ),
            },
          )
        } else {
          updateLine(
            rowId,
            {
              unit_of_measure:
                getCatalogueUomCode(
                  selectedItem,
                ),

              estimated_unit_price:
                null,
            },
          )
        }
      } catch {
        updateLine(
          rowId,
          {
            unit_of_measure:
              getCatalogueUomCode(
                selectedItem,
              ),

            estimated_unit_price:
              null,
          },
        )
      }
    }


  /*
   * The current CatalogueItem frontend type
   * stores the UOM ID rather than the UOM code.
   *
   * For the first PR MVP we can use a small
   * mapping based on your seeded NEXORA UOM data.
   *
   * Later we'll expose the UOM description directly
   * in the API response.
   */
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
  // ADD / REMOVE LINES
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
        current.items.length ===
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

    setFieldErrors(
      (current) => {
        const nextLines = {
          ...current.lines,
        }

        delete nextLines[rowId]

        return {
          ...current,
          lines: nextLines,
        }
      },
    )
  }


  // ============================================================
  // CREATE
  // ============================================================

  const handleSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setSuccessMessage('')

    const nextErrors:
      PurchaseRequestFieldErrors = {
        header: {},
        lines: {},
      }

    if (
      !form.department.trim()
    ) {
      nextErrors.header.department =
        'Department is required.'
    }

    if (
      ![
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT',
      ].includes(
        form.priority,
      )
    ) {
      nextErrors.header.priority =
        'Select a valid priority.'
    }

    if (
      !form.purpose.trim()
    ) {
      nextErrors.header.purpose =
        'Purpose is required.'
    }

    if (
      form.items.length === 0
    ) {
      setFieldErrors(
        nextErrors,
      )

      setError(
        'At least one purchase request line is required.',
      )

      return
    }

    for (
      const line of
      form.items
    ) {
      const lineErrors:
        PurchaseRequestLineErrors = {}

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

      if (
        !line.unit_of_measure.trim()
      ) {
        lineErrors.unit_of_measure =
          'UOM is required.'
      }

      if (
        line.estimated_unit_price ===
          null
      ) {
        lineErrors.estimated_unit_price =
          'Estimated unit price is required.'
      } else if (
        line.estimated_unit_price <
        0
      ) {
        lineErrors.estimated_unit_price =
          'Estimated unit price cannot be negative.'
      }

      if (
        Object.keys(
          lineErrors,
        ).length > 0
      ) {
        nextErrors.lines[
          line.row_id
        ] = lineErrors
      }
    }

    setFieldErrors(
      nextErrors,
    )

    const headerErrorCount =
      Object.keys(
        nextErrors.header,
      ).length

    const lineErrorCount =
      Object.values(
        nextErrors.lines,
      ).reduce(
        (
          total,
          lineErrors,
        ) =>
          total +
          Object.keys(
            lineErrors,
          ).length,
        0,
      )

    const validationCount =
      headerErrorCount +
      lineErrorCount

    if (
      validationCount > 0
    ) {
      setError(
        `Please correct ${validationCount} highlighted field${
          validationCount === 1
            ? ''
            : 's'
        } before continuing.`,
      )

      let firstField:
        string | null = null

      if (
        nextErrors.header.department
      ) {
        firstField =
          'department'
      } else if (
        nextErrors.header.priority
      ) {
        firstField =
          'priority'
      } else if (
        nextErrors.header.purpose
      ) {
        firstField =
          'purpose'
      } else {
        const firstLineEntry =
          Object.entries(
            nextErrors.lines,
          )[0]

        if (firstLineEntry) {
          const [
            rowId,
            lineErrors,
          ] = firstLineEntry

          const firstLineField =
            Object.keys(
              lineErrors,
            )[0]

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
                `[data-pr-field="${firstField}"]`,
              ) as HTMLElement | null

            element?.focus()
          },
        )
      }

      return
    }

    try {
      setIsSaving(true)

      await createPurchaseRequest(
        {
          requested_by_user_id:
            1,

          department:
            form.department.trim(),

          purpose:
            form.purpose.trim(),

          priority:
            form.priority,

          required_by_date:
            form.required_by_date
              ? `${form.required_by_date}T00:00:00`
              : null,

          items:
            form.items.map(
              (line) => ({
                item_code:
                  line.item_code,

                description:
                  line.description,

                quantity:
                  line.quantity as number,

                unit_of_measure:
                  line.unit_of_measure,

                estimated_unit_price:
                  line.estimated_unit_price as number,

                notes:
                  line.notes.trim() ||
                  null,
              }),
            ),
        },
      )

      setShowCreateForm(false)

      setForm(
        createEmptyForm(),
      )

      setFieldErrors({
        header: {},
        lines: {},
      })

      await loadData()

      setSuccessMessage(
        'Purchase request created successfully.',
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to create purchase request.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================
  // UI
  // ============================================================

  // ============================================================
  // FULL PAGE CREATE PURCHASE REQUEST
  // ============================================================

  if (showCreateForm) {
    return (
      <section className="management-page pr-full-page">
        <div className="management-page-header">
          <div>
            <p className="eyebrow">
              PROCUREMENT / PURCHASE REQUESTS / NEW
            </p>

            <h1>
              New Purchase Request
            </h1>

            <p>
              Create an internal procurement requirement using approved catalogue items.
            </p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={handleCloseForm}
          >
            ← Back to Purchase Requests
          </button>
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
          className="pr-enterprise-form"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* ======================================================
              REQUEST INFORMATION
          ====================================================== */}

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                REQUEST INFORMATION
              </p>

              <h2>
                Purchase Request Details
              </h2>

              <p>
                Define the requesting department, urgency and business purpose.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid three-columns">
                <div className="erp-form-field">
                  <label htmlFor="pr-department">
                    Department *
                  </label>

                  <input
                    id="pr-department"
                    data-pr-field="department"
                    type="text"
                    placeholder="e.g. Production"
                    value={form.department}
                    className={
                      fieldErrors.header.department
                        ? 'field-error'
                        : ''
                    }
                    onChange={(event) => {
                      clearHeaderFieldError(
                        'department',
                      )

                      setForm({
                        ...form,
                        department:
                          event.target.value,
                      })
                    }}
                  />

                  {fieldErrors.header.department && (
                    <span className="field-error-message">
                      {
                        fieldErrors.header.department
                      }
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="pr-priority">
                    Priority *
                  </label>

                  <select
                    id="pr-priority"
                    data-pr-field="priority"
                    value={form.priority}
                    className={
                      fieldErrors.header.priority
                        ? 'field-error'
                        : ''
                    }
                    onChange={(event) => {
                      clearHeaderFieldError(
                        'priority',
                      )

                      setForm({
                        ...form,
                        priority:
                          event.target.value,
                      })
                    }}
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="NORMAL">
                      Normal
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>

                  {fieldErrors.header.priority && (
                    <span className="field-error-message">
                      {
                        fieldErrors.header.priority
                      }
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="pr-required-by">
                    Required By
                  </label>

                  <input
                    id="pr-required-by"
                    type="date"
                    value={form.required_by_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        required_by_date:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="erp-form-field full-width">
                  <label htmlFor="pr-purpose">
                    Purpose *
                  </label>

                  <textarea
                    id="pr-purpose"
                    data-pr-field="purpose"
                    rows={4}
                    placeholder="Why is this purchase required?"
                    value={form.purpose}
                    className={
                      fieldErrors.header.purpose
                        ? 'field-error'
                        : ''
                    }
                    onChange={(event) => {
                      clearHeaderFieldError(
                        'purpose',
                      )

                      setForm({
                        ...form,
                        purpose:
                          event.target.value,
                      })
                    }}
                  />

                  {fieldErrors.header.purpose && (
                    <span className="field-error-message">
                      {
                        fieldErrors.header.purpose
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              REQUEST ITEMS
          ====================================================== */}

          <section
            className="data-table-card"
            style={{
              marginTop: '24px',
              marginBottom: '24px',
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
                    REQUEST ITEMS
                  </p>

                  <h2>
                    Purchase Request Lines
                  </h2>

                  <p
                    style={{
                      margin: '6px 0 0',
                      color: '#71869d',
                      fontSize: '12px',
                    }}
                  >
                    Select catalogue items and enter required quantities and estimated pricing.
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
                  border: '1px solid #d9e2ec',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '44px minmax(320px, 1.7fr) 120px 100px 150px 150px 100px',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f5f8fb',
                    borderBottom: '1px solid #d9e2ec',
                    color: '#486581',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  <div>#</div>
                  <div>Catalogue Item *</div>
                  <div>Qty *</div>
                  <div>UOM *</div>
                  <div>Est. Unit Price *</div>
                  <div>Est. Line Total</div>
                  <div style={{ textAlign: 'center' }}>
                    Action
                  </div>
                </div>

                {/* Rows */}
                {form.items.map(
                  (
                    line,
                    index,
                  ) => (
                    <div
                      key={line.row_id}
                      style={{
                        borderBottom:
                          index === form.items.length - 1
                            ? 'none'
                            : '1px solid #e6edf3',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '44px minmax(320px, 1.7fr) 120px 100px 150px 150px 100px',
                          gap: '12px',
                          alignItems: 'start',
                          padding: '14px',
                        }}
                      >
                        <div
                          style={{
                            minHeight: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 700,
                            color: '#243b53',
                          }}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <select
                            data-pr-field={`line-${line.row_id}-catalogue_item_id`}
                            value={line.catalogue_item_id}
                            className={
                              fieldErrors.lines[
                                line.row_id
                              ]?.catalogue_item_id
                                ? 'field-error'
                                : ''
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
                              width: '100%',
                              height: '38px',
                              boxSizing: 'border-box',
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
                                  {item.item_code}
                                  {' — '}
                                  {item.item_name}
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

                          {line.catalogue_item_id > 0 && (
                            <div
                              style={{
                                marginTop: '6px',
                                color: '#486581',
                                fontSize: '11px',
                                lineHeight: 1.35,
                              }}
                            >
                              <strong>
                                {line.item_code}
                              </strong>

                              <span
                                style={{
                                  marginLeft: '8px',
                                  color: '#829ab1',
                                }}
                              >
                                {line.description}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <input
                            data-pr-field={`line-${line.row_id}-quantity`}
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            value={
                              line.quantity ??
                              ''
                            }
                            className={
                              fieldErrors.lines[
                                line.row_id
                              ]?.quantity
                                ? 'field-error'
                                : ''
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
                              width: '100%',
                              height: '38px',
                              boxSizing: 'border-box',
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
                        </div>

                        <div>
                          <input
                            data-pr-field={`line-${line.row_id}-unit_of_measure`}
                            type="text"
                            readOnly
                            value={
                              line.unit_of_measure
                            }
                            className={
                              fieldErrors.lines[
                                line.row_id
                              ]?.unit_of_measure
                                ? 'field-error'
                                : ''
                            }
                            style={{
                              width: '100%',
                              height: '38px',
                              boxSizing: 'border-box',
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
                        </div>

                        <div>
                          <input
                            data-pr-field={`line-${line.row_id}-estimated_unit_price`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              line.estimated_unit_price ??
                              ''
                            }
                            className={
                              fieldErrors.lines[
                                line.row_id
                              ]?.estimated_unit_price
                                ? 'field-error'
                                : ''
                            }
                            onChange={(
                              event,
                            ) => {
                              clearLineFieldError(
                                line.row_id,
                                'estimated_unit_price',
                              )

                              updateLine(
                                line.row_id,
                                {
                                  estimated_unit_price:
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
                              width: '100%',
                              height: '38px',
                              boxSizing: 'border-box',
                            }}
                          />

                          {fieldErrors.lines[
                            line.row_id
                          ]?.estimated_unit_price && (
                            <span className="field-error-message">
                              {
                                fieldErrors.lines[
                                  line.row_id
                                ]?.estimated_unit_price
                              }
                            </span>
                          )}

                          {!fieldErrors.lines[
                            line.row_id
                          ]?.estimated_unit_price &&
                            line.catalogue_item_id > 0 && (
                            <small
                              style={{
                                display: 'block',
                                marginTop: '5px',
                                color: '#829ab1',
                              }}
                            >
                              Based on supplier pricing
                            </small>
                          )}
                        </div>

                        <div
                          style={{
                            minHeight: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 700,
                            color: '#243b53',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          AUD{' '}
                          {calculateLineTotal(
                            line,
                          ).toFixed(
                            2,
                          )}
                        </div>

                        <div
                          style={{
                            minHeight: '38px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            type="button"
                            className="table-action-button"
                            disabled={
                              form.items.length <= 1
                            }
                            onClick={() =>
                              handleRemoveLine(
                                line.row_id,
                              )
                            }
                            title={
                              form.items.length <= 1
                                ? 'At least one line is required.'
                                : 'Remove line'
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '120px minmax(0, 1fr)',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '10px 14px 14px 70px',
                          background: '#fbfdff',
                          borderTop: '1px solid #eef3f7',
                        }}
                      >
                        <span
                          style={{
                            color: '#627d98',
                            fontSize: '11px',
                            fontWeight: 700,
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
                            width: '100%',
                            height: '36px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    color: '#71869d',
                    fontSize: '12px',
                  }}
                >
                  {form.items.length}{' '}
                  {form.items.length === 1
                    ? 'line'
                    : 'lines'}{' '}
                  in this request.
                </span>

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleAddLine}
                >
                  + Add Another Line
                </button>
              </div>
            </div>
          </section>


          {/* ======================================================
              REQUEST SUMMARY
          ====================================================== */}

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                SUMMARY
              </p>

              <h2>
                Request Summary
              </h2>

              <p>
                Review the current estimated value before creating the draft.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="pr-summary-grid">
                <div className="pr-summary-tile">
                  <span>
                    Total Lines
                  </span>

                  <strong>
                    {form.items.length}
                  </strong>
                </div>

                <div className="pr-summary-tile pr-summary-total">
                  <span>
                    Estimated Request Total
                  </span>

                  <strong>
                    AUD {requestTotal.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              ACTIONS
          ====================================================== */}

          <div className="erp-form-bottom-bar">
            <p>
              Fields marked with * are required.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  handleCloseForm
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
                  ? 'Creating...'
                  : 'Create Draft'}
              </button>
            </div>
          </div>
        </form>
      </section>
    )
  }


  // ============================================================
  // PURCHASE REQUEST LIST
  // ============================================================

  return (
    <section className="management-page">
      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            PROCUREMENT
          </p>

          <h1>
            Purchase Requests
          </h1>

          <p>
            Create and manage internal procurement requirements before purchase order creation.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={
            handleNewRequest
          }
        >
          + New Purchase Request
        </button>
      </div>

      {error && (
        <div
          className="page-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div className="page-message success">
          {successMessage}
        </div>
      )}

      <div className="management-toolbar">
        <input
          type="search"
          placeholder="Search purchase requests..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
        />

        <button
          type="button"
          className="secondary-action-button"
          onClick={() =>
            void loadData()
          }
        >
          Refresh
        </button>
      </div>

      <div className="data-table-card">
        {isLoading ? (
          <p className="table-loading">
            Loading purchase requests...
          </p>
        ) : (
          <div className="data-table-scroll">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>
                    PR Number
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Purpose
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Required By
                  </th>

                  <th>
                    Estimated Total
                  </th>

                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="table-empty-state"
                    >
                      No purchase requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(
                    (
                      request,
                    ) => (
                      <tr
                        key={
                          request.purchase_request_id
                        }
                      >
                        <td>
                          <strong>
                            {request.request_number}
                          </strong>
                        </td>

                        <td>
                          {request.department}
                        </td>

                        <td>
                          {request.purpose}
                        </td>

                        <td>
                          {request.priority}
                        </td>

                        <td>
                          {request.required_by_date
                            ? new Date(
                                request.required_by_date,
                              ).toLocaleDateString(
                                'en-AU',
                              )
                            : '—'}
                        </td>

                        <td>
                          AUD{' '}
                          {Number(
                            request.total_estimated_amount,
                          ).toFixed(
                            2,
                          )}
                        </td>

                        <td>
                          <span className="status-pill">
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}


export default PurchaseRequestsPage
