import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createGoodsReceipt,
  getGoodsReceipts,
  getPurchaseOrders,
  getSuppliers,
} from '../../api/procurementapi'

import type {
  GoodsReceipt,
  PurchaseOrder,
  Supplier,
} from '../../types/procurement'


type GoodsReceiptCreatePageProps = {
  onCancel: () => void

  onCreated: (
    receiptNumber: string,
  ) => Promise<void> | void
}


type ReceiptLineForm = {
  purchase_order_item_id: number

  item_code: string

  description: string

  ordered_quantity: number

  previously_received_quantity: number

  outstanding_quantity: number

  received_quantity: number | null

  rejected_quantity: number | null

  unit_of_measure: string

  notes: string
}


type ReceiptForm = {
  purchase_order_id: number

  delivery_reference: string

  notes: string

  items: ReceiptLineForm[]
}


type GoodsReceiptHeaderErrors = {
  purchase_order_id?: string
  delivery_reference?: string
}


type GoodsReceiptLineErrors = {
  received_quantity?: string
  rejected_quantity?: string
  line_quantity?: string
}


type GoodsReceiptFieldErrors = {
  header: GoodsReceiptHeaderErrors
  lines: Record<number, GoodsReceiptLineErrors>
}


const emptyForm: ReceiptForm = {
  purchase_order_id: 0,
  delivery_reference: '',
  notes: '',
  items: [],
}


function GoodsReceiptCreatePage({
  onCancel,
  onCreated,
}: GoodsReceiptCreatePageProps) {
  const [
    purchaseOrders,
    setPurchaseOrders,
  ] = useState<PurchaseOrder[]>([])

  const [
    goodsReceipts,
    setGoodsReceipts,
  ] = useState<GoodsReceipt[]>([])

  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    form,
    setForm,
  ] = useState<ReceiptForm>(
    emptyForm,
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
  ] = useState<GoodsReceiptFieldErrors>({
    header: {},
    lines: {},
  })


  const clearLineErrors = (
    purchaseOrderItemId: number,
  ) => {
    setFieldErrors((current) => ({
      ...current,
      lines: {
        ...current.lines,
        [purchaseOrderItemId]: {},
      },
    }))
  }


  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setIsLoading(true)
          setError('')

          const [
            orderData,
            receiptData,
            supplierData,
          ] = await Promise.all([
            getPurchaseOrders(),
            getGoodsReceipts(),
            getSuppliers(),
          ])


          // ====================================================
          // RECEIVABLE PURCHASE ORDERS
          // ====================================================
          //
          // APPROVED:
          // Nothing has been received yet.
          //
          // PARTIALLY_RECEIVED:
          // Some quantity remains outstanding.
          //
          // RECEIVED:
          // Must not appear because receiving is complete.
          // ====================================================

          setPurchaseOrders(
            orderData.filter(
              (order) =>
                order.status ===
                  'APPROVED' ||
                order.status ===
                  'PARTIALLY_RECEIVED',
            ),
          )

          setGoodsReceipts(
            receiptData,
          )

          setSuppliers(
            supplierData,
          )
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load receiving data.',
          )
        } finally {
          setIsLoading(false)
        }
      }

    void loadData()
  }, [])


  // ============================================================
  // SELECTED PURCHASE ORDER
  // ============================================================

  const selectedPurchaseOrder =
    useMemo(() => {
      return (
        purchaseOrders.find(
          (order) =>
            order.purchase_order_id ===
            form.purchase_order_id,
        ) ??
        null
      )
    }, [
      purchaseOrders,
      form.purchase_order_id,
    ])


  // ============================================================
  // SELECTED SUPPLIER
  // ============================================================

  const selectedSupplier =
    useMemo(() => {
      if (
        !selectedPurchaseOrder
      ) {
        return null
      }

      return (
        suppliers.find(
          (supplier) =>
            supplier.supplier_id ===
            selectedPurchaseOrder.supplier_id,
        ) ??
        null
      )
    }, [
      suppliers,
      selectedPurchaseOrder,
    ])


  // ============================================================
  // PREVIOUSLY RECEIVED QUANTITY
  // ============================================================

  const getPreviouslyReceivedQuantity = (
    purchaseOrderId: number,
    purchaseOrderItemId: number,
  ): number => {
    return goodsReceipts
      .filter(
        (receipt) =>
          receipt.purchase_order_id ===
          purchaseOrderId,
      )
      .flatMap(
        (receipt) =>
          receipt.items,
      )
      .filter(
        (receiptItem) =>
          receiptItem.purchase_order_item_id ===
          purchaseOrderItemId,
      )
      .reduce(
        (
          total,
          receiptItem,
        ) =>
          total +
          Number(
            receiptItem.received_quantity,
          ),
        0,
      )
  }


  // ============================================================
  // PURCHASE ORDER SELECTION
  // ============================================================

  const handlePurchaseOrderChange = (
    purchaseOrderId: number,
  ) => {
    setError('')
    setFieldErrors({
      header: {},
      lines: {},
    })

    const order =
      purchaseOrders.find(
        (item) =>
          item.purchase_order_id ===
          purchaseOrderId,
      )

    if (!order) {
      setForm({
        ...emptyForm,
      })

      return
    }


    const receiptLines:
      ReceiptLineForm[] =
      order.items.map(
        (item) => {
          const orderedQuantity =
            Number(
              item.quantity,
            )

          const previouslyReceived =
            getPreviouslyReceivedQuantity(
              order.purchase_order_id,
              item.purchase_order_item_id,
            )

          const outstandingQuantity =
            Math.max(
              0,
              orderedQuantity -
                previouslyReceived,
            )

          return {
            purchase_order_item_id:
              item.purchase_order_item_id,

            item_code:
              item.item_code ?? '',

            description:
              item.description,

            ordered_quantity:
              orderedQuantity,

            previously_received_quantity:
              previouslyReceived,

            outstanding_quantity:
              outstandingQuantity,

            received_quantity:
              null,

            rejected_quantity:
              0,

            unit_of_measure:
              item.unit_of_measure,

            notes:
              '',
          }
        },
      )


    setForm({
      purchase_order_id:
        order.purchase_order_id,

      delivery_reference:
        '',

      notes:
        '',

      items:
        receiptLines,
    })
  }


  // ============================================================
  // LINE UPDATE
  // ============================================================

  const updateLine = (
    purchaseOrderItemId:
      number,

    updates:
      Partial<ReceiptLineForm>,
  ) => {
    setForm(
      (current) => ({
        ...current,

        items:
          current.items.map(
            (line) =>
              line.purchase_order_item_id ===
              purchaseOrderItemId
                ? {
                    ...line,
                    ...updates,
                  }
                : line,
          ),
      }),
    )
  }


  // ============================================================
  // SUMMARY TOTALS
  // ============================================================

  const totalOrdered =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          line.ordered_quantity,
        0,
      )
    }, [form.items])


  const totalPreviouslyReceived =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          line.previously_received_quantity,
        0,
      )
    }, [form.items])


  const totalOutstanding =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          line.outstanding_quantity,
        0,
      )
    }, [form.items])


  const totalReceivingNow =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          (
            line.received_quantity ??
            0
          ),
        0,
      )
    }, [form.items])


  const totalRejected =
    useMemo(() => {
      return form.items.reduce(
        (
          total,
          line,
        ) =>
          total +
          (
            line.rejected_quantity ??
            0
          ),
        0,
      )
    }, [form.items])


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
      GoodsReceiptFieldErrors = {
        header: {},
        lines: {},
      }

    if (
      form.purchase_order_id <= 0
    ) {
      nextErrors.header.purchase_order_id =
        'Purchase order is required.'
    }

    if (
      !form.delivery_reference.trim()
    ) {
      nextErrors.header.delivery_reference =
        'Delivery reference is required.'
    }

    if (
      form.purchase_order_id > 0 &&
      form.items.length === 0
    ) {
      setFieldErrors(nextErrors)
      setError(
        'The purchase order does not contain receipt lines.',
      )
      return
    }

    for (const line of form.items) {
      const received =
        line.received_quantity ?? 0

      const rejected =
        line.rejected_quantity ?? 0

      const lineErrors:
        GoodsReceiptLineErrors = {}

      if (received < 0) {
        lineErrors.received_quantity =
          'Received quantity cannot be negative.'
      }

      if (rejected < 0) {
        lineErrors.rejected_quantity =
          'Rejected quantity cannot be negative.'
      }

      if (
        received + rejected >
        line.outstanding_quantity
      ) {
        lineErrors.line_quantity =
          `Received plus rejected cannot exceed outstanding quantity of ${line.outstanding_quantity}.`
      }

      if (
        Object.keys(lineErrors).length >
        0
      ) {
        nextErrors.lines[
          line.purchase_order_item_id
        ] = lineErrors
      }
    }

    const hasQuantity =
      form.items.some(
        (line) =>
          (line.received_quantity ?? 0) >
            0 ||
          (line.rejected_quantity ?? 0) >
            0,
      )

    if (
      form.purchase_order_id > 0 &&
      form.items.length > 0 &&
      !hasQuantity
    ) {
      const firstLine = form.items[0]

      nextErrors.lines[
        firstLine.purchase_order_item_id
      ] = {
        ...nextErrors.lines[
          firstLine.purchase_order_item_id
        ],
        line_quantity:
          'Enter a received or rejected quantity for at least one line.',
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
        `Please correct ${validationCount} highlighted validation issue${
          validationCount === 1 ? '' : 's'
        } before continuing.`,
      )

      let firstField: string | null =
        null

      if (
        nextErrors.header.purchase_order_id
      ) {
        firstField =
          'purchase_order_id'
      } else if (
        nextErrors.header.delivery_reference
      ) {
        firstField =
          'delivery_reference'
      } else {
        const firstLine =
          Object.entries(
            nextErrors.lines,
          )[0]

        if (firstLine) {
          const [lineId, errors] =
            firstLine

          firstField =
            errors.rejected_quantity &&
            !errors.received_quantity &&
            !errors.line_quantity
              ? `line-${lineId}-rejected_quantity`
              : `line-${lineId}-received_quantity`
        }
      }

      if (firstField) {
        window.requestAnimationFrame(
          () => {
            const element =
              document.querySelector(
                `[data-gr-field="${firstField}"]`,
              ) as HTMLElement | null

            element?.focus()
          },
        )
      }

      return
    }

    try {
      setIsSaving(true)

      const receipt =
        await createGoodsReceipt(
          {
            purchase_order_id:
              form.purchase_order_id,

            received_by_user_id:
              1,

            delivery_reference:
              form.delivery_reference
                .trim() ||
              null,

            notes:
              form.notes
                .trim() ||
              null,

            items:
              form.items.map(
                (line) => ({
                  purchase_order_item_id:
                    line.purchase_order_item_id,

                  item_code:
                    line.item_code ||
                    null,

                  description:
                    line.description,

                  ordered_quantity:
                    line.ordered_quantity,

                  received_quantity:
                    line.received_quantity ??
                    0,

                  rejected_quantity:
                    line.rejected_quantity ??
                    0,

                  unit_of_measure:
                    line.unit_of_measure,

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
        receipt.receipt_number,
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to create goods receipt.',
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
          Loading receiving data...
        </p>
      </section>
    )
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <section className="management-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            PROCUREMENT / GOODS RECEIPTS
          </p>

          <h1>
            New Goods Receipt
          </h1>

          <p>
            Receive material against
            approved or partially received
            purchase orders.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={
            onCancel
          }
        >
          ← Back to Goods Receipts
        </button>
      </div>


      {/* ========================================================
          ERROR
      ======================================================== */}

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
            RECEIPT HEADER
        ====================================================== */}

        <div className="data-table-card">
          <div
            style={{
              padding: '24px',
            }}
          >
            <p className="eyebrow">
              RECEIPT HEADER
            </p>

            <h2>
              Receipt Information
            </h2>


            <div className="form-grid">

              {/* PURCHASE ORDER */}

              <label>
                Purchase Order *

                <select
                  data-gr-field="purchase_order_id"
                  className={
                    fieldErrors.header.purchase_order_id
                      ? 'field-error'
                      : ''
                  }
                  value={
                    form.purchase_order_id
                  }
                  onChange={(event) =>
                    handlePurchaseOrderChange(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                >
                  <option value={0}>
                    Select receivable PO
                  </option>

                  {purchaseOrders.map(
                    (order) => (
                      <option
                        key={
                          order.purchase_order_id
                        }
                        value={
                          order.purchase_order_id
                        }
                      >
                        {
                          order.po_number
                        }{' '}
                        —{' '}
                        {
                          order.status
                        }{' '}
                        —{' '}
                        {
                          order.currency
                        }{' '}
                        {Number(
                          order.total_amount,
                        ).toFixed(
                          2,
                        )}
                      </option>
                    ),
                  )}
                </select>

                {fieldErrors.header.purchase_order_id && (
                  <span className="field-error-message">
                    {fieldErrors.header.purchase_order_id}
                  </span>
                )}
              </label>


              {/* SUPPLIER */}

              <label>
                Supplier

                <input
                  type="text"
                  readOnly
                  value={
                    selectedSupplier
                      ?.supplier_name ??
                    ''
                  }
                />
              </label>


              {/* DELIVERY REFERENCE */}

              <label>
                Delivery Reference *

                <input
                  data-gr-field="delivery_reference"
                  type="text"
                  placeholder="Delivery note / docket number"
                  value={
                    form.delivery_reference
                  }
                  className={
                    fieldErrors.header.delivery_reference
                      ? 'field-error'
                      : ''
                  }
                  onChange={(event) => {
                    setFieldErrors(
                      (current) => ({
                        ...current,
                        header: {
                          ...current.header,
                          delivery_reference:
                            undefined,
                        },
                      }),
                    )

                    setForm({
                      ...form,

                      delivery_reference:
                        event.target.value,
                    })
                  }}
                />

                {fieldErrors.header.delivery_reference && (
                  <span className="field-error-message">
                    {
                      fieldErrors.header.delivery_reference
                    }
                  </span>
                )}
              </label>


              {/* PO STATUS */}

              <label>
                PO Status

                <input
                  type="text"
                  readOnly
                  value={
                    selectedPurchaseOrder
                      ?.status ??
                    ''
                  }
                />
              </label>


              {/* RECEIPT NOTES */}

              <label className="form-field-full">
                Receipt Notes

                <textarea
                  rows={3}
                  placeholder="Receiving notes"
                  value={
                    form.notes
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,

                      notes:
                        event.target.value,
                    })
                  }
                />
              </label>

            </div>
          </div>
        </div>


        {/* ======================================================
            RECEIPT LINES
        ====================================================== */}

        {selectedPurchaseOrder && (
          <div
            className="data-table-card"
            style={{
              marginTop:
                '24px',
            }}
          >
            <div
              style={{
                padding:
                  '24px',
              }}
            >
              <p className="eyebrow">
                RECEIPT ITEMS
              </p>

              <h2>
                Material Receipt Lines
              </h2>


              {form.items.map(
                (
                  line,
                  index,
                ) => (
                  <div
                    className="pr-line-card"
                    key={
                      line.purchase_order_item_id
                    }
                    style={{
                      marginTop:
                        '20px',
                    }}
                  >
                    <div className="pr-line-card-header">
                      <strong>
                        Line{' '}
                        {index + 1}
                      </strong>

                      {line.outstanding_quantity ===
                        0 && (
                        <span className="status-pill">
                          FULLY RECEIVED
                        </span>
                      )}
                    </div>


                    <div className="form-grid">

                      {/* ITEM CODE */}

                      <label>
                        Item Code

                        <input
                          type="text"
                          readOnly
                          value={
                            line.item_code
                          }
                        />
                      </label>


                      {/* DESCRIPTION */}

                      <label>
                        Description

                        <input
                          type="text"
                          readOnly
                          value={
                            line.description
                          }
                        />
                      </label>


                      {/* ORDERED */}

                      <label>
                        Ordered Quantity

                        <input
                          type="number"
                          readOnly
                          value={
                            line.ordered_quantity
                          }
                        />
                      </label>


                      {/* PREVIOUSLY RECEIVED */}

                      <label>
                        Previously Received

                        <input
                          type="number"
                          readOnly
                          value={
                            line.previously_received_quantity
                          }
                        />
                      </label>


                      {/* OUTSTANDING */}

                      <label>
                        Outstanding Quantity

                        <input
                          type="number"
                          readOnly
                          value={
                            line.outstanding_quantity
                          }
                        />
                      </label>


                      {/* UOM */}

                      <label>
                        UOM

                        <input
                          type="text"
                          readOnly
                          value={
                            line.unit_of_measure
                          }
                        />
                      </label>


                      {/* RECEIVING NOW */}

                      <label>
                        Receive Now *

                        <input
                          data-gr-field={`line-${line.purchase_order_item_id}-received_quantity`}
                          className={
                            fieldErrors.lines[
                              line.purchase_order_item_id
                            ]?.received_quantity ||
                            fieldErrors.lines[
                              line.purchase_order_item_id
                            ]?.line_quantity
                              ? 'field-error'
                              : ''
                          }
                          type="number"
                          min="0"
                          max={
                            line.outstanding_quantity
                          }
                          step="0.0001"
                          disabled={
                            line.outstanding_quantity ===
                            0
                          }
                          value={
                            line.received_quantity ??
                            ''
                          }
                          onChange={(event) => {
                            clearLineErrors(
                              line.purchase_order_item_id,
                            )

                            updateLine(
                              line.purchase_order_item_id,
                              {
                                received_quantity:
                                  event.target
                                    .value ===
                                  ''
                                    ? null
                                    : Number(
                                        event.target
                                          .value,
                                      ),
                              },
                            )
                          }}
                        />

                        {(
                          fieldErrors.lines[
                            line.purchase_order_item_id
                          ]?.received_quantity ||
                          fieldErrors.lines[
                            line.purchase_order_item_id
                          ]?.line_quantity
                        ) && (
                          <span className="field-error-message">
                            {
                              fieldErrors.lines[
                                line.purchase_order_item_id
                              ]?.received_quantity ??
                              fieldErrors.lines[
                                line.purchase_order_item_id
                              ]?.line_quantity
                            }
                          </span>
                        )}
                      </label>


                      {/* REJECTED */}

                      <label>
                        Rejected Quantity *

                        <input
                          data-gr-field={`line-${line.purchase_order_item_id}-rejected_quantity`}
                          className={
                            fieldErrors.lines[
                              line.purchase_order_item_id
                            ]?.rejected_quantity ||
                            fieldErrors.lines[
                              line.purchase_order_item_id
                            ]?.line_quantity
                              ? 'field-error'
                              : ''
                          }
                          type="number"
                          min="0"
                          max={
                            line.outstanding_quantity
                          }
                          step="0.0001"
                          disabled={
                            line.outstanding_quantity ===
                            0
                          }
                          value={
                            line.rejected_quantity ??
                            ''
                          }
                          onChange={(event) => {
                            clearLineErrors(
                              line.purchase_order_item_id,
                            )

                            updateLine(
                              line.purchase_order_item_id,
                              {
                                rejected_quantity:
                                  event.target
                                    .value ===
                                  ''
                                    ? null
                                    : Number(
                                        event.target
                                          .value,
                                      ),
                              },
                            )
                          }}
                        />

                        {fieldErrors.lines[
                          line.purchase_order_item_id
                        ]?.rejected_quantity && (
                          <span className="field-error-message">
                            {
                              fieldErrors.lines[
                                line.purchase_order_item_id
                              ]?.rejected_quantity
                            }
                          </span>
                        )}
                      </label>


                      {/* LINE NOTES */}

                      <label className="form-field-full">
                        Line Notes

                        <input
                          type="text"
                          disabled={
                            line.outstanding_quantity ===
                            0
                          }
                          value={
                            line.notes
                          }
                          onChange={(event) =>
                            updateLine(
                              line.purchase_order_item_id,
                              {
                                notes:
                                  event.target.value,
                              },
                            )
                          }
                        />
                      </label>

                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}


        {/* ======================================================
            RECEIPT SUMMARY
        ====================================================== */}

        {selectedPurchaseOrder && (
          <div
            className="data-table-card"
            style={{
              marginTop:
                '24px',
            }}
          >
            <div
              style={{
                padding:
                  '24px',
              }}
            >
              <p className="eyebrow">
                RECEIPT SUMMARY
              </p>


              <div className="po-summary-card">

                <div>
                  <span>
                    Ordered
                  </span>

                  <strong>
                    {totalOrdered}
                  </strong>
                </div>


                <div>
                  <span>
                    Previously Received
                  </span>

                  <strong>
                    {
                      totalPreviouslyReceived
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Outstanding
                  </span>

                  <strong>
                    {totalOutstanding}
                  </strong>
                </div>


                <div>
                  <span>
                    Receiving Now
                  </span>

                  <strong>
                    {totalReceivingNow}
                  </strong>
                </div>


                <div>
                  <span>
                    Rejected
                  </span>

                  <strong>
                    {totalRejected}
                  </strong>
                </div>

              </div>
            </div>
          </div>
        )}


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
              ? 'Creating Goods Receipt...'
              : 'Create Goods Receipt'}
          </button>
        </div>

      </form>
    </section>
  )
}


export default GoodsReceiptCreatePage