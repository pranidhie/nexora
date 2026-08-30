import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getApprovals,
  getGoodsReceipts,
  getPurchaseOrders,
  getPurchaseRequests,
  getSuppliers,
} from '../../api/procurementapi'

import type {
  Approval,
  GoodsReceipt,
  PurchaseOrder,
  PurchaseRequest,
  Supplier,
} from '../../types/procurement'


type DashboardData = {
  suppliers: Supplier[]
  purchaseRequests: PurchaseRequest[]
  purchaseOrders: PurchaseOrder[]
  approvals: Approval[]
  goodsReceipts: GoodsReceipt[]
}


type StatusChartItem = {
  name: string
  value: number
  colour: string
}


type SupplierSpendItem = {
  supplier: string
  spend: number
}


type SpendTrendItem = {
  month: string
  spend: number
}


const initialData: DashboardData = {
  suppliers: [],
  purchaseRequests: [],
  purchaseOrders: [],
  approvals: [],
  goodsReceipts: [],
}


const STATUS_COLOURS = [
  '#00a6fb',
  '#00d4aa',
  '#7c5cff',
  '#ffb020',
  '#ff5d7a',
  '#56cfe1',
]


type ProcurementDashboardProps = {
  onNavigate?: (
    section:
      | 'dashboard'
      | 'suppliers'
      | 'catalogue'
      | 'purchase-requests'
      | 'purchase-orders'
      | 'approvals'
      | 'goods-receipts'
  ) => void
}


function ProcurementDashboard({
  onNavigate,
}: ProcurementDashboardProps) {
  const [
    data,
    setData,
  ] =
    useState<DashboardData>(
      initialData,
    )

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')


  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          setIsLoading(true)

          setError('')

          const [
            suppliers,
            purchaseRequests,
            purchaseOrders,
            approvals,
            goodsReceipts,
          ] =
            await Promise.all([
              getSuppliers(),

              getPurchaseRequests(),

              getPurchaseOrders(),

              getApprovals(),

              getGoodsReceipts(),
            ])

          setData({
            suppliers,
            purchaseRequests,
            purchaseOrders,
            approvals,
            goodsReceipts,
          })
        } catch (
          dashboardError
        ) {
          const message =
            dashboardError instanceof
            Error
              ? dashboardError.message
              : 'Unable to load procurement dashboard.'

          setError(message)
        } finally {
          setIsLoading(
            false,
          )
        }
      }

    void loadDashboard()
  }, [])


  // ============================================================
  // KPI DATA
  // ============================================================

  const pendingApprovals =
    useMemo(
      () =>
        data.approvals.filter(
          (approval) =>
            approval.status ===
            'PENDING',
        ),
      [
        data.approvals,
      ],
    )


  const approvedOrders =
    useMemo(
      () =>
        data.purchaseOrders.filter(
          (order) =>
            order.status ===
            'APPROVED',
        ),
      [
        data.purchaseOrders,
      ],
    )


  const openPurchaseRequests =
    useMemo(
      () =>
        data.purchaseRequests.filter(
          (request) =>
            ![
              'CLOSED',
              'CANCELLED',
              'REJECTED',
            ].includes(
              request.status,
            ),
        ),
      [
        data.purchaseRequests,
      ],
    )


  const totalPurchaseOrderValue =
    useMemo(
      () =>
        data.purchaseOrders.reduce(
          (
            total,
            order,
          ) =>
            total +
            Number(
              order.total_amount ??
                0,
            ),
          0,
        ),
      [
        data.purchaseOrders,
      ],
    )


  const averageOrderValue =
    data.purchaseOrders.length >
    0
      ? totalPurchaseOrderValue /
        data.purchaseOrders.length
      : 0


  // ============================================================
  // PURCHASE ORDER STATUS CHART
  // ============================================================

  const orderStatusData =
    useMemo<
      StatusChartItem[]
    >(() => {
      const statusCounts =
        new Map<
          string,
          number
        >()

      data.purchaseOrders.forEach(
        (order) => {
          statusCounts.set(
            order.status,
            (
              statusCounts.get(
                order.status,
              ) ?? 0
            ) + 1,
          )
        },
      )

      return Array.from(
        statusCounts.entries(),
      ).map(
        (
          [
            status,
            value,
          ],
          index,
        ) => ({
          name:
            status.replaceAll(
              '_',
              ' ',
            ),

          value,

          colour:
            STATUS_COLOURS[
              index %
                STATUS_COLOURS.length
            ],
        }),
      )
    }, [
      data.purchaseOrders,
    ])


  // ============================================================
  // TOP SUPPLIERS BY PO VALUE
  // ============================================================

  const supplierSpendData =
    useMemo<
      SupplierSpendItem[]
    >(() => {
      const totals =
        new Map<
          number,
          number
        >()

      data.purchaseOrders.forEach(
        (order) => {
          totals.set(
            order.supplier_id,

            (
              totals.get(
                order.supplier_id,
              ) ?? 0
            ) +
              Number(
                order.total_amount ??
                  0,
              ),
          )
        },
      )

      return Array.from(
        totals.entries(),
      )
        .map(
          (
            [
              supplierId,
              spend,
            ],
          ) => {
            const supplier =
              data.suppliers.find(
                (item) =>
                  item.supplier_id ===
                  supplierId,
              )

            return {
              supplier:
                supplier
                  ?.supplier_name ??
                `Supplier ${supplierId}`,

              spend,
            }
          },
        )
        .sort(
          (
            a,
            b,
          ) =>
            b.spend -
            a.spend,
        )
        .slice(
          0,
          6,
        )
    }, [
      data.purchaseOrders,
      data.suppliers,
    ])


  // ============================================================
  // SPEND TREND
  // ============================================================

  const spendTrendData =
    useMemo<
      SpendTrendItem[]
    >(() => {
      const today =
        new Date()

      const months =
        Array.from(
          {
            length: 6,
          },
          (
            _,
            index,
          ) => {
            const date =
              new Date(
                today.getFullYear(),
                today.getMonth() -
                  (5 - index),
                1,
              )

            return {
              key: `${
                date.getFullYear()
              }-${String(
                date.getMonth() +
                  1,
              ).padStart(
                2,
                '0',
              )}`,

              label:
                date.toLocaleDateString(
                  'en-AU',
                  {
                    month:
                      'short',
                  },
                ),

              spend: 0,
            }
          },
        )

      data.purchaseOrders.forEach(
        (order) => {
          if (
            !order.created_at
          ) {
            return
          }

          const date =
            new Date(
              order.created_at,
            )

          if (
            Number.isNaN(
              date.getTime(),
            )
          ) {
            return
          }

          const key = `${
            date.getFullYear()
          }-${String(
            date.getMonth() +
              1,
          ).padStart(
            2,
            '0',
          )}`

          const month =
            months.find(
              (item) =>
                item.key ===
                key,
            )

          if (month) {
            month.spend +=
              Number(
                order.total_amount ??
                  0,
              )
          }
        },
      )

      return months.map(
        (item) => ({
          month:
            item.label,

          spend:
            Number(
              item.spend.toFixed(
                2,
              ),
            ),
        }),
      )
    }, [
      data.purchaseOrders,
    ])


  // ============================================================
  // PURCHASE REQUEST STATUS
  // ============================================================

  const requestStatusData =
    useMemo(() => {
      const statusCounts =
        new Map<
          string,
          number
        >()

      data.purchaseRequests.forEach(
        (request) => {
          statusCounts.set(
            request.status,

            (
              statusCounts.get(
                request.status,
              ) ?? 0
            ) + 1,
          )
        },
      )

      return Array.from(
        statusCounts.entries(),
      ).map(
        (
          [
            status,
            value,
          ],
        ) => ({
          status:
            status.replaceAll(
              '_',
              ' ',
            ),

          value,
        }),
      )
    }, [
      data.purchaseRequests,
    ])


  // ============================================================
  // RECENT ACTIVITY
  // ============================================================

  const recentPurchaseRequests =
    data.purchaseRequests.slice(
      0,
      4,
    )

  const recentPurchaseOrders =
    data.purchaseOrders.slice(
      0,
      4,
    )

  const recentGoodsReceipts =
    data.goodsReceipts.slice(
      0,
      4,
    )


  // ============================================================
  // HELPERS
  // ============================================================

  const formatCurrency =
    (
      value:
        number,
    ) =>
      new Intl.NumberFormat(
        'en-AU',
        {
          style:
            'currency',

          currency:
            'AUD',

          maximumFractionDigits:
            0,
        },
      ).format(
        value,
      )


  // ============================================================
  // LOADING
  // ============================================================

  if (
    isLoading
  ) {
    return (
      <section className="procurement-dashboard">
        <div className="dashboard-loading">
          Loading procurement intelligence...
        </div>
      </section>
    )
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (
    error
  ) {
    return (
      <section className="procurement-dashboard">
        <div
          className="dashboard-error"
          role="alert"
        >
          <p className="eyebrow">
            PROCUREMENT WORKSPACE
          </p>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>
        </div>
      </section>
    )
  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <section className="procurement-dashboard nexora-command-dashboard">

      {/* ======================================================
          HERO
      ====================================================== */}

      <div className="dashboard-hero command-dashboard-hero">

        <div>
          <p className="eyebrow">
            PROCUREMENT INTELLIGENCE
          </p>

          <h1>
            Procurement Command Center
          </h1>

          <p className="dashboard-subtitle">
            Real-time visibility across purchasing,
            approvals, supplier activity and receiving.
          </p>
        </div>


        <div className="dashboard-hero-status">
          <span className="hero-status-dot" />

          <div>
            <strong>
              NEXORA Intelligence Online
            </strong>

            <span>
              Live procurement data
            </span>
          </div>
        </div>

      </div>


      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="dashboard-metrics command-metrics">

        <article
          className="metric-card command-metric-card command-metric-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('suppliers')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onNavigate?.('suppliers')
            }
          }}
        >
          <div className="metric-card-top">
            <span className="metric-icon">
              S
            </span>

            <span className="metric-label">
              Suppliers
            </span>
          </div>

          <strong>
            {data.suppliers.length}
          </strong>

          <p>
            Registered suppliers
          </p>
        </article>


        <article
          className="metric-card command-metric-card command-metric-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('purchase-requests')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onNavigate?.('purchase-requests')
            }
          }}
        >
          <div className="metric-card-top">
            <span className="metric-icon">
              PR
            </span>

            <span className="metric-label">
              Open Requests
            </span>
          </div>

          <strong>
            {openPurchaseRequests.length}
          </strong>

          <p>
            Procurement requirements
          </p>
        </article>


        <article
          className="metric-card command-metric-card command-metric-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('purchase-orders')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onNavigate?.('purchase-orders')
            }
          }}
        >
          <div className="metric-card-top">
            <span className="metric-icon">
              PO
            </span>

            <span className="metric-label">
              Purchase Orders
            </span>
          </div>

          <strong>
            {data.purchaseOrders.length}
          </strong>

          <p>
            {approvedOrders.length}
            {' '}
            approved
          </p>
        </article>


        <article
          className="metric-card command-metric-card attention-card command-metric-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('approvals')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onNavigate?.('approvals')
            }
          }}
        >
          <div className="metric-card-top">
            <span className="metric-icon">
              A
            </span>

            <span className="metric-label">
              Pending Approvals
            </span>
          </div>

          <strong>
            {pendingApprovals.length}
          </strong>

          <p>
            Decisions requiring action
          </p>
        </article>


        <article
          className="metric-card command-metric-card command-metric-clickable"
          role="button"
          tabIndex={0}
          onClick={() => onNavigate?.('purchase-orders')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onNavigate?.('purchase-orders')
            }
          }}
        >
          <div className="metric-card-top">
            <span className="metric-icon">
              $
            </span>

            <span className="metric-label">
              PO Value
            </span>
          </div>

          <strong className="metric-money">
            {formatCurrency(
              totalPurchaseOrderValue,
            )}
          </strong>

          <p>
            Total committed value
          </p>
        </article>

      </div>


      {/* ======================================================
          ANALYTICS ROW 1
      ====================================================== */}

      <div className="dashboard-analytics-grid">

        {/* SPEND TREND */}

        <section className="analytics-card analytics-card-wide">

          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                PROCUREMENT SPEND
              </p>

              <h2>
                Purchase Spend Trend
              </h2>

              <p>
                Purchase order value over the last six months.
              </p>
            </div>

            <div className="analytics-highlight">
              <span>
                Average PO
              </span>

              <strong>
                {formatCurrency(
                  averageOrderValue,
                )}
              </strong>
            </div>
          </div>


          <div className="chart-container chart-large">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={
                  spendTrendData
                }
              >
                <defs>
                  <linearGradient
                    id="nexoraSpendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#00a6fb"
                      stopOpacity={0.45}
                    />

                    <stop
                      offset="95%"
                      stopColor="#00a6fb"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5edf4"
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tickFormatter={(
                    value,
                  ) =>
                    `$${Math.round(
                      Number(
                        value,
                      ) /
                        1000,
                    )}k`
                  }
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(
                    value,
                  ) =>
                    formatCurrency(
                      Number(
                        value,
                      ),
                    )
                  }
                />

                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#008ed6"
                  strokeWidth={3}
                  fill="url(#nexoraSpendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </section>


        {/* ORDER STATUS */}

        <section className="analytics-card">

          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                PURCHASE ORDERS
              </p>

              <h2>
                Order Status
              </h2>

              <p>
                Current purchasing document mix.
              </p>
            </div>
          </div>


          <div className="chart-container donut-chart-container">
            {orderStatusData.length ===
            0 ? (
              <div className="chart-empty-state">
                No purchase order data.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      orderStatusData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={98}
                    paddingAngle={4}
                  >
                    {orderStatusData.map(
                      (
                        item,
                      ) => (
                        <Cell
                          key={
                            item.name
                          }
                          fill={
                            item.colour
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>


          <div className="chart-legend">
            {orderStatusData.map(
              (
                item,
              ) => (
                <div
                  key={
                    item.name
                  }
                  className="chart-legend-row"
                >
                  <span
                    className="chart-legend-dot"
                    style={{
                      backgroundColor:
                        item.colour,
                    }}
                  />

                  <span>
                    {item.name}
                  </span>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              ),
            )}
          </div>

        </section>

      </div>


      {/* ======================================================
          ANALYTICS ROW 2
      ====================================================== */}

      <div className="dashboard-analytics-grid">

        {/* TOP SUPPLIERS */}

        <section className="analytics-card">

          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                SUPPLIER INTELLIGENCE
              </p>

              <h2>
                Top Suppliers
              </h2>

              <p>
                Highest supplier value by purchase orders.
              </p>
            </div>
          </div>


          <div className="chart-container chart-medium">
            {supplierSpendData.length ===
            0 ? (
              <div className="chart-empty-state">
                No supplier spend data.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    supplierSpendData
                  }
                  layout="vertical"
                  margin={{
                    left:
                      15,
                    right:
                      20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e6edf3"
                  />

                  <XAxis
                    type="number"
                    tickFormatter={(
                      value,
                    ) =>
                      `$${Math.round(
                        Number(
                          value,
                        ) /
                          1000,
                      )}k`
                    }
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="supplier"
                    width={125}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(
                      value,
                    ) =>
                      formatCurrency(
                        Number(
                          value,
                        ),
                      )
                    }
                  />

                  <Bar
                    dataKey="spend"
                    fill="#00a6fb"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </section>


        {/* REQUEST STATUS */}

        <section className="analytics-card">

          <div className="analytics-card-header">
            <div>
              <p className="eyebrow">
                DEMAND PIPELINE
              </p>

              <h2>
                Request Status
              </h2>

              <p>
                Current purchase request workload.
              </p>
            </div>
          </div>


          <div className="chart-container chart-medium">
            {requestStatusData.length ===
            0 ? (
              <div className="chart-empty-state">
                No purchase request data.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    requestStatusData
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e6edf3"
                  />

                  <XAxis
                    dataKey="status"
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    fill="#7c5cff"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </section>

      </div>


      {/* ======================================================
          PROCUREMENT PIPELINE
      ====================================================== */}

      <section className="pipeline-panel command-pipeline">

        <div className="section-heading-row">
          <div>
            <p className="eyebrow">
              PROCUREMENT PIPELINE
            </p>

            <h2>
              End-to-end purchasing flow
            </h2>
          </div>

          <span className="section-badge">
            Live Workflow
          </span>
        </div>


        <div className="pipeline-steps">

          <button
            type="button"
            className="pipeline-step pipeline-step-button"
            onClick={() => onNavigate?.('purchase-requests')}
          >
            <span className="pipeline-number">
              01
            </span>

            <div>
              <strong>
                Purchase Request
              </strong>

              <span>
                {
                  data.purchaseRequests.length
                }{' '}
                records
              </span>
            </div>
          </button>


          <span className="pipeline-arrow">
            →
          </span>


          <button
            type="button"
            className="pipeline-step pipeline-step-button"
            onClick={() => onNavigate?.('purchase-orders')}
          >
            <span className="pipeline-number">
              02
            </span>

            <div>
              <strong>
                Purchase Order
              </strong>

              <span>
                {
                  data.purchaseOrders.length
                }{' '}
                records
              </span>
            </div>
          </button>


          <span className="pipeline-arrow">
            →
          </span>


          <div className="pipeline-step">
            <span className="pipeline-number">
              03
            </span>

            <div>
              <strong>
                Approval
              </strong>

              <span>
                {
                  pendingApprovals.length
                }{' '}
                pending
              </span>
            </div>
          </div>


          <span className="pipeline-arrow">
            →
          </span>


          <button
            type="button"
            className="pipeline-step pipeline-step-button"
            onClick={() => onNavigate?.('goods-receipts')}
          >
            <span className="pipeline-number">
              04
            </span>

            <div>
              <strong>
                Goods Receipt
              </strong>

              <span>
                {
                  data.goodsReceipts.length
                }{' '}
                received
              </span>
            </div>
          </button>

        </div>

      </section>


      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <div className="dashboard-grid">

        <section className="dashboard-panel">

          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                RECENT ACTIVITY
              </p>

              <h2>
                Purchase Requests
              </h2>
            </div>

            <span className="section-count">
              {
                data.purchaseRequests.length
              }
            </span>
          </div>


          <div className="activity-list">
            {recentPurchaseRequests.length ===
            0 ? (
              <p className="empty-state">
                No purchase requests available.
              </p>
            ) : (
              recentPurchaseRequests.map(
                (
                  request,
                ) => (
                  <div
                    key={
                      request.purchase_request_id
                    }
                    className="activity-row"
                  >
                    <div>
                      <strong>
                        {request.request_number}
                      </strong>

                      <span>
                        {request.department}
                      </span>
                    </div>

                    <div className="activity-meta">
                      <span
                        className={`status-pill status-${request.status.toLowerCase()}`}
                      >
                        {request.status}
                      </span>

                      <strong>
                        AUD{' '}
                        {Number(
                          request.total_estimated_amount,
                        ).toFixed(
                          2,
                        )}
                      </strong>
                    </div>
                  </div>
                ),
              )
            )}
          </div>

        </section>


        <section className="dashboard-panel">

          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                WORK QUEUE
              </p>

              <h2>
                Pending Approvals
              </h2>
            </div>

            <span className="section-count">
              {
                pendingApprovals.length
              }
            </span>
          </div>


          <div className="activity-list">
            {pendingApprovals.length ===
            0 ? (
              <div className="approval-clear-state">
                <span>
                  ✓
                </span>

                <div>
                  <strong>
                    No approvals pending
                  </strong>

                  <p>
                    Procurement approval queue is clear.
                  </p>
                </div>
              </div>
            ) : (
              pendingApprovals
                .slice(
                  0,
                  4,
                )
                .map(
                  (
                    approval,
                  ) => (
                    <div
                      key={
                        approval.approval_id
                      }
                      className="activity-row"
                    >
                      <div>
                        <strong>
                          {
                            approval.document_type
                          }
                        </strong>

                        <span>
                          Document #
                          {
                            approval.document_id
                          }
                        </span>
                      </div>

                      <span className="status-pill status-pending">
                        PENDING
                      </span>
                    </div>
                  ),
                )
            )}
          </div>

        </section>


        <section className="dashboard-panel">

          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                PURCHASING
              </p>

              <h2>
                Recent Purchase Orders
              </h2>
            </div>

            <span className="section-count">
              {
                data.purchaseOrders.length
              }
            </span>
          </div>


          <div className="activity-list">
            {recentPurchaseOrders.length ===
            0 ? (
              <p className="empty-state">
                No purchase orders available.
              </p>
            ) : (
              recentPurchaseOrders.map(
                (
                  order,
                ) => (
                  <div
                    key={
                      order.purchase_order_id
                    }
                    className="activity-row"
                  >
                    <div>
                      <strong>
                        {order.po_number}
                      </strong>

                      <span>
                        Supplier #
                        {order.supplier_id}
                      </span>
                    </div>

                    <div className="activity-meta">
                      <span
                        className={`status-pill status-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>

                      <strong>
                        {order.currency}
                        {' '}
                        {Number(
                          order.total_amount,
                        ).toFixed(
                          2,
                        )}
                      </strong>
                    </div>
                  </div>
                ),
              )
            )}
          </div>

        </section>


        <section className="dashboard-panel">

          <div className="section-heading-row">
            <div>
              <p className="eyebrow">
                RECEIVING
              </p>

              <h2>
                Recent Goods Receipts
              </h2>
            </div>

            <span className="section-count">
              {
                data.goodsReceipts.length
              }
            </span>
          </div>


          <div className="activity-list">
            {recentGoodsReceipts.length ===
            0 ? (
              <p className="empty-state">
                No goods receipts available.
              </p>
            ) : (
              recentGoodsReceipts.map(
                (
                  receipt,
                ) => (
                  <div
                    key={
                      receipt.goods_receipt_id
                    }
                    className="activity-row"
                  >
                    <div>
                      <strong>
                        {
                          receipt.receipt_number
                        }
                      </strong>

                      <span>
                        PO #
                        {
                          receipt.purchase_order_id
                        }
                      </span>
                    </div>

                    <span
                      className={`status-pill status-${receipt.status.toLowerCase()}`}
                    >
                      {receipt.status}
                    </span>
                  </div>
                ),
              )
            )}
          </div>

        </section>

      </div>

    </section>
  )
}


export default ProcurementDashboard