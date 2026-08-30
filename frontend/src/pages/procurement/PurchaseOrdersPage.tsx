import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getPurchaseOrders,
  getSuppliers,
} from '../../api/procurementapi'

import type {
  PurchaseOrder,
  Supplier,
} from '../../types/procurement'

import PurchaseOrderCreatePage from './PurchaseOrderCreatePage'

import PurchaseOrderDetailsPage from './PurchaseOrderDetailsPage'


type ViewMode =
  | 'list'
  | 'create'
  | 'details'


function PurchaseOrdersPage() {
  const [
    purchaseOrders,
    setPurchaseOrders,
  ] = useState<PurchaseOrder[]>([])

  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    selectedPurchaseOrder,
    setSelectedPurchaseOrder,
  ] = useState<
    PurchaseOrder | null
  >(null)

  const [
    viewMode,
    setViewMode,
  ] = useState<ViewMode>(
    'list',
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
        orderData,
        supplierData,
      ] = await Promise.all([
        getPurchaseOrders(),
        getSuppliers(),
      ])

      setPurchaseOrders(
        orderData,
      )

      setSuppliers(
        supplierData,
      )

      return orderData
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load purchase orders.',
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
  // FILTER
  // ============================================================

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return purchaseOrders
      }

      return purchaseOrders.filter(
        (order) => {
          const supplier =
            suppliers.find(
              (item) =>
                item.supplier_id ===
                order.supplier_id,
            )

          return [
            order.po_number,
            order.status,
            order.currency,
            supplier?.supplier_name ??
              '',
            supplier?.supplier_code ??
              '',
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          )
        },
      )
    }, [
      purchaseOrders,
      suppliers,
      search,
    ])


  // ============================================================
  // LOOKUPS
  // ============================================================

  const getSupplier = (
    supplierId: number,
  ): Supplier | null => {
    return (
      suppliers.find(
        (supplier) =>
          supplier.supplier_id ===
          supplierId,
      ) ??
      null
    )
  }


  const getSupplierName = (
    supplierId: number,
  ) => {
    const supplier =
      getSupplier(
        supplierId,
      )

    return (
      supplier?.supplier_name ??
      `Supplier #${supplierId}`
    )
  }


  // ============================================================
  // CREATE
  // ============================================================

  const handleOpenCreatePage =
    () => {
      setError('')
      setSuccessMessage('')
      setViewMode(
        'create',
      )
    }


  const handlePurchaseOrderCreated =
    async (
      poNumber: string,
    ) => {
      await loadData()

      setViewMode(
        'list',
      )

      setSuccessMessage(
        `${poNumber} created successfully.`,
      )
    }


  // ============================================================
  // DETAILS
  // ============================================================

  const handleOpenDetails = (
    order: PurchaseOrder,
  ) => {
    setSelectedPurchaseOrder(
      order,
    )

    setError('')
    setSuccessMessage('')

    setViewMode(
      'details',
    )
  }


  const handleApprovalSubmitted =
    async () => {
      if (
        !selectedPurchaseOrder
      ) {
        return
      }

      const orderId =
        selectedPurchaseOrder
          .purchase_order_id

      const refreshedOrders =
        await loadData()

      const refreshedOrder =
        refreshedOrders.find(
          (order) =>
            order.purchase_order_id ===
            orderId,
        )

      if (refreshedOrder) {
        setSelectedPurchaseOrder(
          refreshedOrder,
        )
      }

      setSuccessMessage(
        'Purchase order submitted for approval.',
      )

      setViewMode(
        'list',
      )
    }


  // ============================================================
  // CREATE PAGE
  // ============================================================

  if (
    viewMode === 'create'
  ) {
    return (
      <PurchaseOrderCreatePage
        onCancel={() =>
          setViewMode(
            'list',
          )
        }
        onCreated={
          handlePurchaseOrderCreated
        }
      />
    )
  }


  // ============================================================
  // DETAILS PAGE
  // ============================================================

  if (
    viewMode === 'details' &&
    selectedPurchaseOrder
  ) {
    return (
      <PurchaseOrderDetailsPage
        purchaseOrder={
          selectedPurchaseOrder
        }
        supplier={
          getSupplier(
            selectedPurchaseOrder
              .supplier_id,
          )
        }
        onBack={() =>
          setViewMode(
            'list',
          )
        }
        onSubmitted={
          handleApprovalSubmitted
        }
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
            Purchase Orders
          </h1>

          <p>
            Create and manage
            supplier purchase orders,
            approvals and receiving
            lifecycle.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={
            handleOpenCreatePage
          }
        >
          + New Purchase Order
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
          placeholder="Search purchase orders..."
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
            Loading purchase orders...
          </p>
        ) : (
          <div className="data-table-scroll">

            <table className="enterprise-table">

              <thead>
                <tr>
                  <th>
                    PO Number
                  </th>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Source
                  </th>

                  <th>
                    Expected Delivery
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody>

                {filteredOrders.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="table-empty-state"
                    >
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(
                    (order) => (
                      <tr
                        key={
                          order.purchase_order_id
                        }
                      >

                        <td>
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              handleOpenDetails(
                                order,
                              )
                            }
                          >
                            {
                              order.po_number
                            }
                          </button>
                        </td>


                        <td>
                          {getSupplierName(
                            order.supplier_id,
                          )}
                        </td>


                        <td>
                          {order.purchase_request_id
                            ? `PR #${order.purchase_request_id}`
                            : 'Direct PO'}
                        </td>


                        <td>
                          {order.expected_delivery_date
                            ? new Date(
                                order.expected_delivery_date,
                              )
                                .toLocaleDateString(
                                  'en-AU',
                                )
                            : '—'}
                        </td>


                        <td>
                          <strong>
                            {
                              order.currency
                            }{' '}
                            {Number(
                              order.total_amount,
                            ).toFixed(
                              2,
                            )}
                          </strong>
                        </td>


                        <td>
                          <span className="status-pill">
                            {
                              order.status
                            }
                          </span>
                        </td>


                        <td>
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              handleOpenDetails(
                                order,
                              )
                            }
                          >
                            View
                          </button>
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


export default PurchaseOrdersPage