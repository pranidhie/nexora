import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getGoodsReceipts,
  getPurchaseOrders,
  getSuppliers,
} from '../../api/procurementapi'

import type {
  GoodsReceipt,
  PurchaseOrder,
  Supplier,
} from '../../types/procurement'

import GoodsReceiptCreatePage from './GoodsReceiptCreatePage'
import GoodsReceiptDetailsPage from './GoodsReceiptDetailsPage'


type ViewMode =
  | 'list'
  | 'create'
  | 'details'


function GoodsReceiptsPage() {
  const [
    receipts,
    setReceipts,
  ] = useState<GoodsReceipt[]>([])

  const [
    purchaseOrders,
    setPurchaseOrders,
  ] = useState<PurchaseOrder[]>([])

  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] = useState<GoodsReceipt | null>(null)

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>('list')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')


  // ============================================================
  // LOAD
  // ============================================================

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [
        receiptData,
        purchaseOrderData,
        supplierData,
      ] = await Promise.all([
        getGoodsReceipts(),
        getPurchaseOrders(),
        getSuppliers(),
      ])

      setReceipts(
        receiptData,
      )

      setPurchaseOrders(
        purchaseOrderData,
      )

      setSuppliers(
        supplierData,
      )

      return receiptData
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load goods receipts.',
      )

      return []
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    void loadData()
  }, [])


  // ============================================================
  // LOOKUPS
  // ============================================================

  const getPO = (
    purchaseOrderId: number,
  ) => {
    return (
      purchaseOrders.find(
        (order) =>
          order.purchase_order_id ===
          purchaseOrderId,
      ) ?? null
    )
  }


  const getSupplier = (
    order: PurchaseOrder | null,
  ) => {
    if (!order) {
      return null
    }

    return (
      suppliers.find(
        (supplier) =>
          supplier.supplier_id ===
          order.supplier_id,
      ) ?? null
    )
  }


  // ============================================================
  // FILTER
  // ============================================================

  const filteredReceipts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return receipts
      }

      return receipts.filter(
        (receipt) => {
          const order =
            getPO(
              receipt.purchase_order_id,
            )

          const supplier =
            getSupplier(
              order,
            )

          return [
            receipt.receipt_number,
            receipt.status,
            receipt.delivery_reference ??
              '',
            order?.po_number ??
              '',
            supplier?.supplier_name ??
              '',
          ].some(
            (value) =>
              value
                ?.toLowerCase()
                .includes(
                  query,
                ),
          )
        },
      )
    }, [
      receipts,
      purchaseOrders,
      suppliers,
      search,
    ])


  // ============================================================
  // CREATE CALLBACK
  // ============================================================

  const handleCreated =
    async (
      receiptNumber: string,
    ) => {
      await loadData()

      setViewMode(
        'list',
      )

      setSuccessMessage(
        `${receiptNumber} created successfully. Inventory was updated.`,
      )
    }


  // ============================================================
  // CREATE PAGE
  // ============================================================

  if (
    viewMode ===
    'create'
  ) {
    return (
      <GoodsReceiptCreatePage
        onCancel={() =>
          setViewMode(
            'list',
          )
        }
        onCreated={
          handleCreated
        }
      />
    )
  }


  // ============================================================
  // DETAILS PAGE
  // ============================================================

  if (
    viewMode ===
      'details' &&
    selectedReceipt
  ) {
    const order =
      getPO(
        selectedReceipt.purchase_order_id,
      )

    return (
      <GoodsReceiptDetailsPage
        receipt={
          selectedReceipt
        }
        purchaseOrder={
          order
        }
        supplier={
          getSupplier(
            order,
          )
        }
        onBack={() => {
          setSelectedReceipt(
            null,
          )

          setViewMode(
            'list',
          )
        }}
      />
    )
  }


  // ============================================================
  // LIST PAGE
  // ============================================================

  return (
    <section className="management-page">
      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            PROCUREMENT
          </p>

          <h1>
            Goods Receipts
          </h1>

          <p>
            Record material receipts,
            inspect receiving history
            and verify inventory
            posting.
          </p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="primary-action-button"
            onClick={() => {
              setError('')
              setSuccessMessage('')

              setViewMode(
                'create',
              )
            }}
          >
            + New Goods Receipt
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


      {successMessage && (
        <div
          className="page-message success"
          role="status"
        >
          {successMessage}
        </div>
      )}


      <div className="management-toolbar">
        <input
          type="search"
          placeholder="Search goods receipts..."
          value={
            search
          }
          onChange={
            (event) =>
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
            Loading goods receipts...
          </p>
        ) : (
          <div className="data-table-scroll">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>
                    Receipt Number
                  </th>

                  <th>
                    Purchase Order
                  </th>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Delivery Reference
                  </th>

                  <th>
                    Received Qty
                  </th>

                  <th>
                    Rejected Qty
                  </th>

                  <th>
                    Received At
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReceipts.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="table-empty-state"
                    >
                      No goods receipts
                      found.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(
                    (
                      receipt,
                    ) => {
                      const order =
                        getPO(
                          receipt.purchase_order_id,
                        )

                      const supplier =
                        getSupplier(
                          order,
                        )

                      const totalReceived =
                        receipt.items.reduce(
                          (
                            total,
                            item,
                          ) =>
                            total +
                            Number(
                              item.received_quantity,
                            ),
                          0,
                        )

                      const totalRejected =
                        receipt.items.reduce(
                          (
                            total,
                            item,
                          ) =>
                            total +
                            Number(
                              item.rejected_quantity,
                            ),
                          0,
                        )

                      return (
                        <tr
                          key={
                            receipt.goods_receipt_id
                          }
                        >
                          <td>
                            <strong>
                              {
                                receipt.receipt_number
                              }
                            </strong>
                          </td>

                          <td>
                            {order?.po_number ??
                              `PO #${receipt.purchase_order_id}`}
                          </td>

                          <td>
                            {supplier?.supplier_name ??
                              '—'}
                          </td>

                          <td>
                            {receipt.delivery_reference ??
                              '—'}
                          </td>

                          <td>
                            <strong>
                              {
                                totalReceived
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              totalRejected
                            }
                          </td>

                          <td>
                            {receipt.received_at
                              ? new Date(
                                  receipt.received_at,
                                ).toLocaleString(
                                  'en-AU',
                                )
                              : '—'}
                          </td>

                          <td>
                            <span className="status-pill">
                              {
                                receipt.status
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() => {
                                setSelectedReceipt(
                                  receipt,
                                )

                                setViewMode(
                                  'details',
                                )
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    },
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


export default GoodsReceiptsPage