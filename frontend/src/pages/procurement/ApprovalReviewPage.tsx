import {
  useState,
} from 'react'

import {
  decideApproval,
} from '../../api/procurementapi'

import type {
  Approval,
  PurchaseOrder,
  Supplier,
} from '../../types/procurement'


type ApprovalReviewPageProps = {
  approval: Approval

  purchaseOrder:
    PurchaseOrder | null

  supplier:
    Supplier | null

  onBack:
    () => void

  onDecisionCompleted:
    (
      decision:
        'APPROVED' | 'REJECTED',
    ) => Promise<void> | void
}


function ApprovalReviewPage({
  approval,
  purchaseOrder,
  supplier,
  onBack,
  onDecisionCompleted,
}: ApprovalReviewPageProps) {
  const [
    comments,
    setComments,
  ] = useState(
    approval.comments ?? '',
  )

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    commentError,
    setCommentError,
  ] = useState('')


  // ============================================================
  // DECISION
  // ============================================================

  const handleDecision = async (
    decision:
      'APPROVED' | 'REJECTED',
  ) => {
    setError('')
    setCommentError('')

    const trimmedComments =
      comments.trim()

    // Rejection requires a reason for auditability.
    if (
      decision === 'REJECTED' &&
      !trimmedComments
    ) {
      setCommentError(
        'A rejection reason is required.',
      )

      setError(
        'Please provide a rejection reason before rejecting this purchase order.',
      )

      window.requestAnimationFrame(
        () => {
          const element =
            document.querySelector(
              '[data-approval-field="comments"]',
            ) as HTMLTextAreaElement | null

          element?.focus()
        },
      )

      return
    }

    try {
      setIsProcessing(true)

      await decideApproval(
        approval.approval_id,
        {
          status:
            decision,

          comments:
            trimmedComments ||
            null,
        },
      )

      await onDecisionCompleted(
        decision,
      )
    } catch (
      decisionError
    ) {
      setError(
        decisionError
          instanceof Error
          ? decisionError.message
          : 'Unable to process approval decision.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // ============================================================
  // FALLBACK
  // ============================================================

  if (!purchaseOrder) {
    return (
      <section className="management-page">
        <div className="management-page-header">
          <div>
            <p className="eyebrow">
              PROCUREMENT / APPROVALS
            </p>

            <h1>
              Approval Review
            </h1>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={
              onBack
            }
          >
            ← Back to Approvals
          </button>
        </div>


        <div
          className="page-message error"
          role="alert"
        >
          The purchase order linked to this approval could not be found.
        </div>
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
            PROCUREMENT / APPROVALS
          </p>

          <h1>
            Review {purchaseOrder.po_number}
          </h1>

          <p>
            Review purchase order
            details before making an
            approval decision.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={
            onBack
          }
        >
          ← Back to Approvals
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


      {/* ========================================================
          APPROVAL SUMMARY
      ======================================================== */}

      <div className="data-table-card">
        <div
          style={{
            padding: '24px',
          }}
        >
          <div className="po-details-title-row">

            <div>
              <p className="eyebrow">
                APPROVAL REQUEST
              </p>

              <h2>
                Approval Information
              </h2>
            </div>

            <span className="status-pill">
              {approval.status}
            </span>

          </div>


          <div className="po-detail-grid">

            <div>
              <span>
                Approval ID
              </span>

              <strong>
                #{approval.approval_id}
              </strong>
            </div>


            <div>
              <span>
                Document
              </span>

              <strong>
                {purchaseOrder.po_number}
              </strong>
            </div>


            <div>
              <span>
                Approval Level
              </span>

              <strong>
                Level{' '}
                {approval.approval_level}
              </strong>
            </div>


            <div>
              <span>
                Approver User
              </span>

              <strong>
                User #
                {approval.approver_user_id}
              </strong>
            </div>


            <div>
              <span>
                Submitted
              </span>

             <strong>
  {approval.created_at
    ? new Date(
        approval.created_at,
      ).toLocaleString(
        'en-AU',
      )
    : '—'}
</strong>
            </div>


            <div>
              <span>
                Status
              </span>

              <strong>
                {approval.status}
              </strong>
            </div>

          </div>
        </div>
      </div>


      {/* ========================================================
          PO HEADER
      ======================================================== */}

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
            PURCHASE ORDER
          </p>

          <h2>
            Order Information
          </h2>


          <div className="po-detail-grid">

            <div>
              <span>
                PO Number
              </span>

              <strong>
                {purchaseOrder.po_number}
              </strong>
            </div>


            <div>
              <span>
                Supplier
              </span>

              <strong>
                {supplier
                  ?.supplier_name ??
                  `Supplier #${purchaseOrder.supplier_id}`}
              </strong>
            </div>


            <div>
              <span>
                Supplier Code
              </span>

              <strong>
                {supplier
                  ?.supplier_code ??
                  '—'}
              </strong>
            </div>


            <div>
              <span>
                Source
              </span>

              <strong>
                {purchaseOrder
                  .purchase_request_id
                  ? `PR #${purchaseOrder.purchase_request_id}`
                  : 'Direct PO'}
              </strong>
            </div>


            <div>
              <span>
                Expected Delivery
              </span>

              <strong>
                {purchaseOrder
                  .expected_delivery_date
                  ? new Date(
                      purchaseOrder
                        .expected_delivery_date,
                    ).toLocaleDateString(
                      'en-AU',
                    )
                  : '—'}
              </strong>
            </div>


            <div>
              <span>
                PO Status
              </span>

              <strong>
                {purchaseOrder.status}
              </strong>
            </div>

          </div>


          <div
            style={{
              marginTop: '24px',
            }}
          >
            <p className="eyebrow">
              DELIVERY ADDRESS
            </p>

            <p>
              {purchaseOrder
                .delivery_address ??
                'No delivery address provided.'}
            </p>
          </div>


          <div
            style={{
              marginTop: '20px',
            }}
          >
            <p className="eyebrow">
              PO NOTES
            </p>

            <p>
              {purchaseOrder
                .notes ??
                'No PO notes.'}
            </p>
          </div>
        </div>
      </div>


      {/* ========================================================
          PO LINES
      ======================================================== */}

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
            ORDER ITEMS
          </p>

          <h2>
            Purchase Order Lines
          </h2>


          <div className="data-table-scroll">

            <table className="enterprise-table">

              <thead>
                <tr>
                  <th>
                    Item Code
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    UOM
                  </th>

                  <th>
                    Unit Price
                  </th>

                  <th>
                    Tax
                  </th>

                  <th>
                    Line Total
                  </th>
                </tr>
              </thead>


              <tbody>

                {purchaseOrder.items.map(
                  (item) => (
                    <tr
                      key={
                        item.purchase_order_item_id
                      }
                    >

                      <td>
                        {item.item_code ??
                          '—'}
                      </td>


                      <td>
                        {item.description}
                      </td>


                      <td>
                        {item.quantity}
                      </td>


                      <td>
                        {
                          item.unit_of_measure
                        }
                      </td>


                      <td>
                        {
                          purchaseOrder.currency
                        }{' '}
                        {Number(
                          item.unit_price,
                        ).toFixed(2)}
                      </td>


                      <td>
                        {
                          purchaseOrder.currency
                        }{' '}
                        {Number(
                          item.tax_amount,
                        ).toFixed(2)}
                      </td>


                      <td>
                        <strong>
                          {
                            purchaseOrder.currency
                          }{' '}
                          {Number(
                            item.line_total,
                          ).toFixed(2)}
                        </strong>
                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>
        </div>
      </div>


      {/* ========================================================
          TOTALS
      ======================================================== */}

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
                {
                  purchaseOrder.currency
                }{' '}
                {Number(
                  purchaseOrder.subtotal,
                ).toFixed(2)}
              </strong>
            </div>


            <div>
              <span>
                Tax
              </span>

              <strong>
                {
                  purchaseOrder.currency
                }{' '}
                {Number(
                  purchaseOrder.tax_amount,
                ).toFixed(2)}
              </strong>
            </div>


            <div>
              <span>
                PO Total
              </span>

              <strong>
                {
                  purchaseOrder.currency
                }{' '}
                {Number(
                  purchaseOrder.total_amount,
                ).toFixed(2)}
              </strong>
            </div>

          </div>
        </div>
      </div>


      {/* ========================================================
          DECISION
      ======================================================== */}

      <div
        className="data-table-card"
        style={{
          marginTop: '24px',
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            padding: '24px',
          }}
        >
          <p className="eyebrow">
            APPROVAL DECISION
          </p>

          <h2>
            Review Decision
          </h2>


          {approval.status ===
          'PENDING' ? (
            <>
              <label
                style={{
                  display: 'block',
                  marginTop: '20px',
                }}
              >
                Comments
                <span
                  style={{
                    marginLeft: '6px',
                    color: '#7b8794',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  (required for rejection)
                </span>

                <textarea
                  data-approval-field="comments"
                  rows={4}
                  placeholder="Add approval comments or a rejection reason..."
                  value={comments}
                  className={
                    commentError
                      ? 'field-error'
                      : ''
                  }
                  onChange={(event) => {
                    setComments(
                      event.target.value,
                    )

                    if (commentError) {
                      setCommentError('')
                    }

                    if (error) {
                      setError('')
                    }
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '8px',
                  }}
                  aria-invalid={
                    Boolean(
                      commentError,
                    )
                  }
                  aria-describedby={
                    commentError
                      ? 'approval-comment-error'
                      : undefined
                  }
                />

                {commentError && (
                  <span
                    id="approval-comment-error"
                    className="field-error-message"
                  >
                    {commentError}
                  </span>
                )}
              </label>


              <div
                className="form-actions"
                style={{
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  className="secondary-action-button"
                  disabled={
                    isProcessing
                  }
                  onClick={() =>
                    void handleDecision(
                      'REJECTED',
                    )
                  }
                >
                  {isProcessing
                    ? 'Processing...'
                    : 'Reject'}
                </button>


                <button
                  type="button"
                  className="primary-action-button"
                  disabled={
                    isProcessing
                  }
                  onClick={() =>
                    void handleDecision(
                      'APPROVED',
                    )
                  }
                >
                  {isProcessing
                    ? 'Processing...'
                    : 'Approve Purchase Order'}
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: '20px',
              }}
            >
              <p>
                This approval has already
                been decided.
              </p>

              <p>
                Decision:{' '}
                <strong>
                  {approval.status}
                </strong>
              </p>

              {approval.comments && (
                <p>
                  Comments:{' '}
                  {approval.comments}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

    </section>
  )
}


export default ApprovalReviewPage