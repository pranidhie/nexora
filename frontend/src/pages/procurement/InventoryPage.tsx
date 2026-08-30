import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getCatalogueItems,
  getInventoryBalances,
  getInventoryTransactions,
} from '../../api/procurementapi'

import type {
  CatalogueItem,
  InventoryBalance,
  InventoryTransaction,
} from '../../types/procurement'


function InventoryPage() {
  const [
    balances,
    setBalances,
  ] = useState<InventoryBalance[]>([])

  const [
    transactions,
    setTransactions,
  ] = useState<
    InventoryTransaction[]
  >([])

  const [
    catalogueItems,
    setCatalogueItems,
  ] = useState<CatalogueItem[]>([])

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    warehouseFilter,
    setWarehouseFilter,
  ] = useState('ALL')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')


  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadData =
    async () => {
      try {
        setIsLoading(true)
        setError('')

        const [
          balanceData,
          transactionData,
          catalogueData,
        ] = await Promise.all([
          getInventoryBalances(),
          getInventoryTransactions(),
          getCatalogueItems(),
        ])

        setBalances(
          balanceData,
        )

        setTransactions(
          transactionData,
        )

        setCatalogueItems(
          catalogueData,
        )
      } catch (loadError) {
        setError(
          loadError
            instanceof Error
            ? loadError.message
            : 'Unable to load inventory data.',
        )
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

  const itemMap =
    useMemo(() => {
      const map =
        new Map<
          number,
          CatalogueItem
        >()

      catalogueItems.forEach(
        (item) => {
          map.set(
            item.catalogue_item_id,
            item,
          )
        },
      )

      return map
    }, [
      catalogueItems,
    ])


  const getItemName = (
    catalogueItemId: number,
  ) => {
    return (
      itemMap.get(
        catalogueItemId,
      )?.item_name ??
      'Unknown item'
    )
  }


  const getItemCode = (
    balance:
      InventoryBalance,
  ) => {
    return (
      balance.item_code ??
      itemMap.get(
        balance.catalogue_item_id,
      )?.item_code ??
      `Item #${balance.catalogue_item_id}`
    )
  }


  // ============================================================
  // KPI DATA
  // ============================================================

  const totalSkuCount =
    useMemo(() => {
      return new Set(
        balances.map(
          (balance) =>
            balance.catalogue_item_id,
        ),
      ).size
    }, [
      balances,
    ])


  const totalOnHand =
    useMemo(() => {
      return balances.reduce(
        (
          total,
          balance,
        ) =>
          total +
          Number(
            balance.on_hand_quantity ??
            balance.quantity_on_hand ??
            0,
          ),
        0,
      )
    }, [
      balances,
    ])


  const totalAvailable =
    useMemo(() => {
      return balances.reduce(
        (
          total,
          balance,
        ) =>
          total +
          Number(
            balance.available_quantity ??
            balance.quantity_available ??
            balance.on_hand_quantity ??
            balance.quantity_on_hand ??
            0,
          ),
        0,
      )
    }, [
      balances,
    ])


  const totalReserved =
    useMemo(() => {
      return balances.reduce(
        (
          total,
          balance,
        ) =>
          total +
          Number(
            balance.reserved_quantity ??
            balance.quantity_reserved ??
            0,
          ),
        0,
      )
    }, [
      balances,
    ])


  // ============================================================
  // FILTER OPTIONS
  // ============================================================

  const warehouseOptions =
    useMemo(() => {
      return Array.from(
        new Set(
          balances
            .map(
              (balance) =>
                balance.warehouse_id,
            )
            .filter(
              (
                warehouseId,
              ): warehouseId is number =>
                warehouseId !==
                  null &&
                warehouseId !==
                  undefined,
            ),
        ),
      ).sort(
        (a, b) =>
          a - b,
      )
    }, [
      balances,
    ])


  // ============================================================
  // FILTERED BALANCES
  // ============================================================

  const filteredBalances =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return balances.filter(
        (balance) => {
          const item =
            itemMap.get(
              balance.catalogue_item_id,
            )

          const searchable =
            [
              balance.item_code ??
                '',
              item?.item_code ??
                '',
              item?.item_name ??
                '',
              balance.unit_of_measure ??
                '',
              balance.warehouse_id?.toString() ??
                '',
              balance.warehouse_location_id?.toString() ??
                '',
            ]
              .join(' ')
              .toLowerCase()

          const matchesSearch =
            !query ||
            searchable.includes(
              query,
            )

          const matchesWarehouse =
            warehouseFilter ===
              'ALL' ||
            String(
              balance.warehouse_id ??
                '',
            ) ===
              warehouseFilter

          return (
            matchesSearch &&
            matchesWarehouse
          )
        },
      )
    }, [
      balances,
      itemMap,
      search,
      warehouseFilter,
    ])


  // ============================================================
  // FILTERED TRANSACTIONS
  // ============================================================

  const filteredTransactions =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return transactions.filter(
        (transaction) => {
          const item =
            itemMap.get(
              transaction.catalogue_item_id,
            )

          const searchable =
            [
              transaction.item_code ??
                '',
              item?.item_code ??
                '',
              item?.item_name ??
                '',
              transaction.transaction_type ??
                '',
              transaction.reference_number ??
                '',
              transaction.source_document_type ??
                '',
              transaction.source_document_id?.toString() ??
                '',
              transaction.reference_type ??
                '',
              transaction.reference_id?.toString() ??
                '',
              transaction.warehouse_id?.toString() ??
                '',
            ]
              .join(' ')
              .toLowerCase()

          const matchesSearch =
            !query ||
            searchable.includes(
              query,
            )

          const matchesWarehouse =
            warehouseFilter ===
              'ALL' ||
            String(
              transaction.warehouse_id ??
                '',
            ) ===
              warehouseFilter

          return (
            matchesSearch &&
            matchesWarehouse
          )
        },
      )
    }, [
      transactions,
      itemMap,
      search,
      warehouseFilter,
    ])


  // ============================================================
  // HELPERS
  // ============================================================

  const formatQuantity = (
    value:
      number | undefined,
  ) => {
    return Number(
      value ?? 0,
    ).toLocaleString(
      'en-AU',
      {
        maximumFractionDigits:
          4,
      },
    )
  }


  const formatDateTime = (
    value?:
      string,
  ) => {
    if (!value) {
      return '—'
    }

    const date =
      new Date(
        value,
      )

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleString(
      'en-AU',
      {
        day:
          '2-digit',

        month:
          '2-digit',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',
      },
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
            PROCUREMENT / INVENTORY
          </p>

          <h1>
            Inventory Management
          </h1>

          <p>
            Monitor stock on hand,
            availability, reservations
            and inventory movements
            generated by procurement
            receiving.
          </p>
        </div>

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


      {/* ========================================================
          KPI CARDS
      ======================================================== */}

      <div
        className="dashboard-metrics"
        style={{
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          marginBottom:
            '22px',
        }}
      >
        <article className="metric-card">
          <div className="metric-card-top">
            <span className="metric-icon">
              SKU
            </span>

            <span className="metric-label">
              Stocked Items
            </span>
          </div>

          <strong>
            {totalSkuCount}
          </strong>

          <p>
            Unique catalogue items
          </p>
        </article>


        <article className="metric-card">
          <div className="metric-card-top">
            <span className="metric-icon">
              OH
            </span>

            <span className="metric-label">
              On Hand
            </span>
          </div>

          <strong>
            {formatQuantity(
              totalOnHand,
            )}
          </strong>

          <p>
            Physical stock recorded
          </p>
        </article>


        <article className="metric-card">
          <div className="metric-card-top">
            <span className="metric-icon">
              AV
            </span>

            <span className="metric-label">
              Available
            </span>
          </div>

          <strong>
            {formatQuantity(
              totalAvailable,
            )}
          </strong>

          <p>
            Available for use
          </p>
        </article>


        <article className="metric-card">
          <div className="metric-card-top">
            <span className="metric-icon">
              RS
            </span>

            <span className="metric-label">
              Reserved
            </span>
          </div>

          <strong>
            {formatQuantity(
              totalReserved,
            )}
          </strong>

          <p>
            Allocated / reserved stock
          </p>
        </article>
      </div>


      {/* ========================================================
          FILTERS
      ======================================================== */}

      <div
        className="management-toolbar"
        style={{
          marginBottom:
            '18px',
        }}
      >
        <input
          type="search"
          placeholder="Search item, code, UOM, warehouse or transaction..."
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

        <select
          value={
            warehouseFilter
          }
          onChange={
            (event) =>
              setWarehouseFilter(
                event.target.value,
              )
          }
          style={{
            minWidth:
              '190px',

            height:
              '42px',

            padding:
              '0 12px',

            border:
              '1px solid #cbd5e1',

            borderRadius:
              '9px',

            background:
              '#ffffff',

            color:
              '#243b53',
          }}
        >
          <option value="ALL">
            All Warehouses
          </option>

          {warehouseOptions.map(
            (
              warehouseId,
            ) => (
              <option
                key={
                  warehouseId
                }
                value={
                  warehouseId
                }
              >
                Warehouse #
                {warehouseId}
              </option>
            ),
          )}
        </select>

        <button
          type="button"
          className="secondary-action-button"
          disabled={
            isLoading
          }
          onClick={
            () =>
              void loadData()
          }
        >
          {isLoading
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>


      {/* ========================================================
          STOCK ON HAND
      ======================================================== */}

      <div className="data-table-card">
        <div
          style={{
            padding:
              '22px 24px 14px',
          }}
        >
          <p className="eyebrow">
            INVENTORY
          </p>

          <h2>
            Stock On Hand
          </h2>

          <p
            style={{
              margin:
                '6px 0 0',

              color:
                '#71869d',

              fontSize:
                '12px',
            }}
          >
            Current stock balances posted
            from procurement goods receipts.
          </p>
        </div>

        {isLoading ? (
          <p className="table-loading">
            Loading inventory balances...
          </p>
        ) : filteredBalances.length ===
          0 ? (
          <div
            className="table-empty-state"
            style={{
              padding:
                '34px 24px',
            }}
          >
            <strong
              style={{
                display:
                  'block',

                marginBottom:
                  '7px',

                color:
                  '#334e68',
              }}
            >
              No stock balances found
            </strong>

            <span>
              Stock will appear here after
              an approved purchase order is
              received through Goods
              Receipts.
            </span>
          </div>
        ) : (
          <div className="data-table-scroll">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>
                    Item Code
                  </th>

                  <th>
                    Item
                  </th>

                  <th>
                    UOM
                  </th>

                  <th>
                    Warehouse
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    On Hand
                  </th>

                  <th>
                    Available
                  </th>

                  <th>
                    Reserved
                  </th>

                  <th>
                    Last Movement
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredBalances.map(
                  (
                    balance,
                  ) => (
                    <tr
                      key={
                        balance.inventory_balance_id
                      }
                    >
                      <td>
                        <strong>
                          {getItemCode(
                            balance,
                          )}
                        </strong>
                      </td>

                      <td>
                        {getItemName(
                          balance.catalogue_item_id,
                        )}
                      </td>

                      <td>
                        {balance.unit_of_measure ??
                          '—'}
                      </td>

                      <td>
                        {balance.warehouse_id
                          ? `#${balance.warehouse_id}`
                          : '—'}
                      </td>

                      <td>
                        {balance.warehouse_location_id
                          ? `#${balance.warehouse_location_id}`
                          : '—'}
                      </td>

                      <td>
                        <strong>
                          {formatQuantity(
                            balance.on_hand_quantity ??
                              balance.quantity_on_hand,
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatQuantity(
                          balance.quantity_available ??
                            balance.on_hand_quantity ??
                              balance.quantity_on_hand,
                        )}
                      </td>

                      <td>
                        {formatQuantity(
                          balance.reserved_quantity ??
                            balance.quantity_reserved ??
                            0,
                        )}
                      </td>

                      <td>
                        {formatDateTime(
                          balance.last_transaction_at ??
                            balance.updated_at,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ========================================================
          INVENTORY LEDGER
      ======================================================== */}

      <div
        className="data-table-card"
        style={{
          marginTop:
            '22px',

          marginBottom:
            '40px',
        }}
      >
        <div
          style={{
            padding:
              '22px 24px 14px',
          }}
        >
          <p className="eyebrow">
            INVENTORY LEDGER
          </p>

          <h2>
            Stock Transactions
          </h2>

          <p
            style={{
              margin:
                '6px 0 0',

              color:
                '#71869d',

              fontSize:
                '12px',
            }}
          >
            Audit trail of inventory
            movements created by procurement
            receiving and other stock
            transactions.
          </p>
        </div>

        {isLoading ? (
          <p className="table-loading">
            Loading inventory transactions...
          </p>
        ) : filteredTransactions.length ===
          0 ? (
          <div
            className="table-empty-state"
            style={{
              padding:
                '34px 24px',
            }}
          >
            <strong
              style={{
                display:
                  'block',

                marginBottom:
                  '7px',

                color:
                  '#334e68',
              }}
            >
              No inventory transactions found
            </strong>

            <span>
              Inventory movements will be
              recorded here when stock is
              received or otherwise adjusted
              by the backend.
            </span>
          </div>
        ) : (
          <div className="data-table-scroll">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Item
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Warehouse
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Reference
                  </th>

                  <th>
                    Notes
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map(
                  (
                    transaction,
                  ) => (
                    <tr
                      key={
                        transaction.inventory_transaction_id
                      }
                    >
                      <td>
                        {formatDateTime(
                          transaction.created_at,
                        )}
                      </td>

                      <td>
                        <strong>
                          {transaction.item_code ??
                            itemMap.get(
                              transaction.catalogue_item_id,
                            )?.item_code ??
                            `Item #${transaction.catalogue_item_id}`}
                        </strong>

                        <div
                          style={{
                            marginTop:
                              '3px',

                            color:
                              '#71869d',

                            fontSize:
                              '11px',
                          }}
                        >
                          {getItemName(
                            transaction.catalogue_item_id,
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="status-pill">
                          {transaction.transaction_type
                            .replaceAll(
                              '_',
                              ' ',
                            )}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {formatQuantity(
                            transaction.quantity,
                          )}
                        </strong>
                      </td>

                      <td>
                        {transaction.warehouse_id
                          ? `#${transaction.warehouse_id}`
                          : '—'}
                      </td>

                      <td>
                        {transaction.warehouse_location_id
                          ? `#${transaction.warehouse_location_id}`
                          : '—'}
                      </td>

                      <td>
                        {transaction.reference_number
                          ? transaction.reference_number
                          : transaction.source_document_type
                            ? `${transaction.source_document_type}${
                                transaction.source_document_id
                                  ? ` #${transaction.source_document_id}`
                                  : ''
                              }`
                            : transaction.reference_type
                              ? `${transaction.reference_type}${
                                  transaction.reference_id
                                    ? ` #${transaction.reference_id}`
                                    : ''
                                }`
                              : '—'}
                      </td>

                      <td>
                        {transaction.notes ??
                          '—'}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}


export default InventoryPage