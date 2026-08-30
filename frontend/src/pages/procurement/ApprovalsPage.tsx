import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getApprovals,
  getPurchaseOrders,
  getSuppliers,
} from '../../api/procurementapi'

import type {
  Approval,
  PurchaseOrder,
  Supplier,
} from '../../types/procurement'

import ApprovalReviewPage from './ApprovalReviewPage'


type ViewMode =
  | 'list'
  | 'review'


function ApprovalsPage() {
  const [
    approvals,
    setApprovals,
  ] = useState<Approval[]>([])

  const [
    purchaseOrders,
    setPurchaseOrders,
  ] = useState<PurchaseOrder[]>([])

  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    selectedApproval,
    setSelectedApproval,
  ] = useState<Approval | null>(
    null,
  )

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
  // LOAD DATA
  // ============================================================

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [
        approvalData,
        orderData,
        supplierData,
      ] = await Promise.all([
        getApprovals(),
        getPurchaseOrders(),
        getSuppliers(),
      ])

      setApprovals(
        approvalData,
      )

      setPurchaseOrders(
        orderData,
      )

      setSuppliers(
        supplierData,
      )

      return approvalData
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load approvals.',
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

  const getPurchaseOrderForApproval = (
    approval: Approval,
  ): PurchaseOrder | null => {
    if (
      approval.document_type !==
      'PURCHASE_ORDER'
    ) {
      return null
    }

    return (
      purchaseOrders.find(
        (order) =>
          order.purchase_order_id ===
          approval.document_id,
      ) ??
      null
    )
  }


  const getSupplierForOrder = (
    order: PurchaseOrder | null,
  ): Supplier | null => {
    if (!order) {
      return null
    }

    return (
      suppliers.find(
        (supplier) =>
          supplier.supplier_id ===
          order.supplier_id,
      ) ??
      null
    )
  }


  // ============================================================
  // FILTER
  // ============================================================

  const filteredApprovals =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return approvals
      }

      return approvals.filter(
        (approval) => {
          const order =
            approval.document_type ===
            'PURCHASE_ORDER'
              ? purchaseOrders.find(
                  (item) =>
                    item.purchase_order_id ===
                    approval.document_id,
                )
              : undefined

          const supplier =
            order
              ? suppliers.find(
                  (item) =>
                    item.supplier_id ===
                    order.supplier_id,
                )
              : undefined

          return [
            approval.document_type,
            approval.status,
            String(
              approval.approval_level,
            ),
            order?.po_number ?? '',
            supplier?.supplier_name ?? '',
          ].some((value) =>
            value
              .toLowerCase()
              .includes(query),
          )
        },
      )
    }, [
      approvals,
      purchaseOrders,
      suppliers,
      search,
    ])


  // ============================================================
  // OPEN REVIEW
  // ============================================================

  const handleOpenReview = (
    approval: Approval,
  ) => {
    setSelectedApproval(
      approval,
    )

    setError('')
    setSuccessMessage('')

    setViewMode(
      'review',
    )
  }


  // ============================================================
  // DECISION COMPLETED
  // ============================================================

  const handleDecisionCompleted =
    async (
      decision:
        'APPROVED' | 'REJECTED',
    ) => {
      await loadData()

      setSelectedApproval(
        null,
      )

      setViewMode(
        'list',
      )

      setSuccessMessage(
        `Purchase order ${decision.toLowerCase()} successfully.`,
      )
    }


  // ============================================================
  // REVIEW PAGE
  // ============================================================

  if (
    viewMode === 'review' &&
    selectedApproval
  ) {
    const order =
      getPurchaseOrderForApproval(
        selectedApproval,
      )

    const supplier =
      getSupplierForOrder(
        order,
      )

    return (
      <ApprovalReviewPage
        approval={
          selectedApproval
        }
        purchaseOrder={
          order
        }
        supplier={
          supplier
        }
        onBack={() => {
          setSelectedApproval(
            null,
          )

          setViewMode(
            'list',
          )
        }}
        onDecisionCompleted={
          handleDecisionCompleted
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
            Approvals
          </h1>

          <p>
            Review and process procurement
            documents waiting for approval.
          </p>
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
          placeholder="Search approvals..."
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
            Loading approvals...
          </p>
        ) : (
          <div className="data-table-scroll">

            <table className="enterprise-table">

              <thead>
                <tr>
                  <th>
                    Document
                  </th>

                  <th>
                    Supplier
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Level
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody>

                {filteredApprovals.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="table-empty-state"
                    >
                      No approvals found.
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map(
                    (approval) => {
                      const order =
                        getPurchaseOrderForApproval(
                          approval,
                        )

                      const supplier =
                        getSupplierForOrder(
                          order,
                        )

                      return (
                        <tr
                          key={
                            approval.approval_id
                          }
                        >

                          <td>
                            <strong>
                              {order
                                ? order.po_number
                                : `${approval.document_type} #${approval.document_id}`}
                            </strong>
                          </td>


                          <td>
                            {supplier
                              ?.supplier_name ??
                              '—'}
                          </td>


                          <td>
                            {order
                              ? `${order.currency} ${Number(
                                  order.total_amount,
                                ).toFixed(2)}`
                              : '—'}
                          </td>


                          <td>
                            Level{' '}
                            {
                              approval.approval_level
                            }
                          </td>


                          <td>
                            <span className="status-pill">
                              {
                                approval.status
                              }
                            </span>
                          </td>


                          <td>
                       
  {approval.created_at
    ? new Date(
        approval.created_at,
      ).toLocaleDateString(
        'en-AU',
      )
    : '—'}

                          </td>


                          <td>
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() =>
                                handleOpenReview(
                                  approval,
                                )
                              }
                            >
                              Review
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


export default ApprovalsPage