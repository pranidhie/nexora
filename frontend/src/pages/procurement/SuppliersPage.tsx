import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createSupplier,
  getSuppliers,
  updateSupplier,
} from '../../api/procurementapi'

import type {
  Supplier,
} from '../../types/procurement'


// ============================================================
// TYPES
// ============================================================

type SupplierFormState = {
  supplier_code: string
  supplier_name: string

  contact_name: string

  email: string
  phone: string

  address: string

  payment_terms: string

  is_active: boolean
}


type SupplierFieldErrors = {
  supplier_code?: string
  supplier_name?: string
  email?: string
}


type PageMode =
  | 'LIST'
  | 'DETAIL'
  | 'CREATE'
  | 'EDIT'


// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm: SupplierFormState = {
  supplier_code: '',
  supplier_name: '',

  contact_name: '',

  email: '',
  phone: '',

  address: '',

  payment_terms: '',

  is_active: true,
}


// ============================================================
// MAIN COMPONENT
// ============================================================

function SuppliersPage() {
  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])

  const [
    selectedSupplier,
    setSelectedSupplier,
  ] = useState<Supplier | null>(null)

  const [
    pageMode,
    setPageMode,
  ] = useState<PageMode>('LIST')

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
    form,
    setForm,
  ] =
    useState<SupplierFormState>(
      emptyForm,
    )


  const [
    fieldErrors,
    setFieldErrors,
  ] = useState<SupplierFieldErrors>({})


  // ============================================================
  // LOAD SUPPLIERS
  // ============================================================

  const loadSuppliers =
    async () => {
      try {
        setIsLoading(true)

        setError('')

        const data =
          await getSuppliers()

        setSuppliers(data)

        // If supplier detail is currently open,
        // refresh selected supplier too.
        if (selectedSupplier) {
          const refreshedSupplier =
            data.find(
              (supplier) =>
                supplier.supplier_id ===
                selectedSupplier.supplier_id,
            )

          if (refreshedSupplier) {
            setSelectedSupplier(
              refreshedSupplier,
            )
          }
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load suppliers.',
        )
      } finally {
        setIsLoading(false)
      }
    }


  useEffect(() => {
    void loadSuppliers()
  }, [])


  // ============================================================
  // FILTER / SEARCH
  // ============================================================

  const filteredSuppliers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return suppliers
      }

      return suppliers.filter(
        (supplier) =>
          [
            supplier.supplier_code,

            supplier.supplier_name,

            supplier.contact_name ??
              '',

            supplier.email ??
              '',

            supplier.phone ??
              '',

            supplier.payment_terms ??
              '',

            supplier.is_active
              ? 'active'
              : 'inactive',
          ].some(
            (value) =>
              value
                .toLowerCase()
                .includes(query),
          ),
      )
    }, [
      search,
      suppliers,
    ])


  // ============================================================
  // NAVIGATION
  // ============================================================

  const openSupplierList =
    () => {
      setPageMode('LIST')

      setSelectedSupplier(
        null,
      )

      setError('')
      setFieldErrors({})

      setForm({
        ...emptyForm,
      })
    }


  const openSupplierDetails =
    (
      supplier:
        Supplier,
    ) => {
      setSelectedSupplier(
        supplier,
      )

      setPageMode('DETAIL')

      setError('')
      setFieldErrors({})

      setSuccessMessage('')
    }


  const openCreateSupplier =
    () => {
      setSelectedSupplier(
        null,
      )

      setForm({
        ...emptyForm,
      })

      setPageMode('CREATE')

      setError('')
      setFieldErrors({})

      setSuccessMessage('')
    }


  const openEditSupplier =
    (
      supplier:
        Supplier,
    ) => {
      setSelectedSupplier(
        supplier,
      )

      setForm({
        supplier_code:
          supplier.supplier_code,

        supplier_name:
          supplier.supplier_name,

        contact_name:
          supplier.contact_name ??
          '',

        email:
          supplier.email ??
          '',

        phone:
          supplier.phone ??
          '',

        address:
          supplier.address ??
          '',

        payment_terms:
          supplier.payment_terms ??
          '',

        is_active:
          supplier.is_active,
      })

      setPageMode('EDIT')

      setError('')
      setFieldErrors({})

      setSuccessMessage('')
    }


  const clearFieldError = (
    field: keyof SupplierFieldErrors,
  ) => {
    setFieldErrors(
      (current) => ({
        ...current,
        [field]: undefined,
      }),
    )
  }


  const isValidEmail = (
    value: string,
  ) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    )
  }


  // ============================================================
  // SAVE
  // ============================================================

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setError('')
      setSuccessMessage('')

      const validationErrors:
        SupplierFieldErrors = {}

      const supplierCode =
        form.supplier_code.trim()

      const supplierName =
        form.supplier_name.trim()

      const email =
        form.email.trim()

      if (!supplierCode) {
        validationErrors.supplier_code =
          'Supplier code is required.'
      }

      if (!supplierName) {
        validationErrors.supplier_name =
          'Supplier name is required.'
      }

      if (
        email &&
        !isValidEmail(email)
      ) {
        validationErrors.email =
          'Enter a valid email address.'
      }

      setFieldErrors(
        validationErrors,
      )

      const validationCount =
        Object.keys(
          validationErrors,
        ).length

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

        const firstField =
          Object.keys(
            validationErrors,
          )[0]

        window.requestAnimationFrame(
          () => {
            const element =
              document.querySelector(
                `[data-supplier-field="${firstField}"]`,
              ) as HTMLElement | null

            element?.focus()
          },
        )

        return
      }

      try {
        setIsSaving(true)

        // ======================================================
        // EDIT
        // ======================================================

        if (
          pageMode === 'EDIT' &&
          selectedSupplier
        ) {
          const updatedSupplier =
            await updateSupplier(
              selectedSupplier.supplier_id,
              {
                supplier_name:
                  supplierName,

                contact_name:
                  form.contact_name.trim() ||
                  null,

                email:
                  email ||
                  null,

                phone:
                  form.phone.trim() ||
                  null,

                address:
                  form.address.trim() ||
                  null,

                payment_terms:
                  form.payment_terms.trim() ||
                  null,

                is_active:
                  form.is_active,
              },
            )

          setSelectedSupplier(
            updatedSupplier,
          )

          setFieldErrors({})

          setSuccessMessage(
            `${updatedSupplier.supplier_code} updated successfully.`,
          )

          await loadSuppliers()

          setPageMode(
            'DETAIL',
          )

          return
        }


        // ======================================================
        // CREATE
        // ======================================================

        const createdSupplier =
          await createSupplier({
            supplier_code:
              supplierCode.toUpperCase(),

            supplier_name:
              supplierName,

            contact_name:
              form.contact_name.trim() ||
              null,

            email:
              email ||
              null,

            phone:
              form.phone.trim() ||
              null,

            address:
              form.address.trim() ||
              null,

            payment_terms:
              form.payment_terms.trim() ||
              null,
          })


        await loadSuppliers()

        setSelectedSupplier(
          createdSupplier,
        )

        setFieldErrors({})

        setSuccessMessage(
          `${createdSupplier.supplier_code} created successfully.`,
        )

        setPageMode(
          'DETAIL',
        )
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save supplier.',
        )
      } finally {
        setIsSaving(false)
      }
    }

  // ============================================================
  // SUPPLIER LIST
  // ============================================================

  if (
    pageMode === 'LIST'
  ) {
    return (
      <section
        className="management-page"
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="management-page-header"
        >
          <div>
            <p
              className="eyebrow"
            >
              PROCUREMENT / MASTER DATA
            </p>

            <h1>
              Suppliers
            </h1>

            <p>
              Manage supplier master data,
              purchasing relationships and
              commercial information.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-button"
            onClick={
              openCreateSupplier
            }
          >
            + Create Supplier
          </button>
        </div>


        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {successMessage && (
          <div
            className="page-message success"
          >
            {successMessage}
          </div>
        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className="page-message error"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div
          className="management-toolbar"
        >
          <input
            type="search"
            placeholder="Search supplier code, name, contact, email or status..."
            value={search}
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
            onClick={
              () =>
                void loadSuppliers()
            }
          >
            Refresh
          </button>
        </div>


        {/* =====================================================
            TABLE
        ===================================================== */}

        <div
          className="data-table-card"
        >
          {isLoading ? (
            <p
              className="table-loading"
            >
              Loading suppliers...
            </p>
          ) : (
            <div
              className="data-table-scroll"
            >
              <table
                className="enterprise-table"
              >
                <thead>
                  <tr>
                    <th>
                      Supplier Code
                    </th>

                    <th>
                      Supplier
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Payment Terms
                    </th>

                    <th>
                      Status
                    </th>

                    <th
                      aria-label="Actions"
                    />
                  </tr>
                </thead>

                <tbody>
                  {
                    filteredSuppliers.length ===
                    0
                      ? (
                          <tr>
                            <td
                              colSpan={
                                7
                              }
                              className="table-empty-state"
                            >
                              No suppliers found.
                            </td>
                          </tr>
                        )
                      : (
                          filteredSuppliers.map(
                            (
                              supplier,
                            ) => (
                              <tr
                                key={
                                  supplier.supplier_id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      supplier.supplier_code
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    supplier.supplier_name
                                  }
                                </td>

                                <td>
                                  {
                                    supplier.contact_name ||
                                    '—'
                                  }
                                </td>

                                <td>
                                  {
                                    supplier.email ||
                                    '—'
                                  }
                                </td>

                                <td>
                                  {
                                    supplier.payment_terms ||
                                    '—'
                                  }
                                </td>

                                <td>
                                  <span
                                    className={
                                      supplier.is_active
                                        ? 'status-pill status-approved'
                                        : 'status-pill status-rejected'
                                    }
                                  >
                                    {
                                      supplier.is_active
                                        ? 'ACTIVE'
                                        : 'INACTIVE'
                                    }
                                  </span>
                                </td>

                                <td
                                  className="table-action-cell"
                                >
                                  <button
                                    type="button"
                                    className="table-action-button"
                                    onClick={
                                      () =>
                                        openSupplierDetails(
                                          supplier,
                                        )
                                    }
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ),
                          )
                        )
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    )
  }


  // ============================================================
  // SUPPLIER DETAILS
  // ============================================================

  if (
    pageMode ===
      'DETAIL' &&
    selectedSupplier
  ) {
    const supplier =
      selectedSupplier

    return (
      <section
        className="management-page"
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div
          className="management-page-header"
        >
          <div>
            <p
              className="eyebrow"
            >
              PROCUREMENT / SUPPLIERS /
              {
                supplier.supplier_code
              }
            </p>

            <h1>
              {
                supplier.supplier_name
              }
            </h1>

            <p>
              Supplier master record and
              procurement information.
            </p>
          </div>

          <div
            style={{
              display:
                'flex',

              gap:
                '10px',

              alignItems:
                'center',
            }}
          >
            <button
              type="button"
              className="secondary-action-button"
              onClick={
                openSupplierList
              }
            >
              ← Back to Suppliers
            </button>

            <button
              type="button"
              className="primary-action-button"
              onClick={
                () =>
                  openEditSupplier(
                    supplier,
                  )
              }
            >
              Edit Supplier
            </button>
          </div>
        </div>


        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {successMessage && (
          <div
            className="page-message success"
          >
            {successMessage}
          </div>
        )}


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className="page-message error"
            role="alert"
          >
            {error}
          </div>
        )}


        {/* =====================================================
            SUPPLIER SUMMARY
        ===================================================== */}

        <div
          className="data-table-card"
          style={{
            marginBottom:
              '18px',
          }}
        >
          <div
            style={{
              padding:
                '22px',
            }}
          >
            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'flex-start',

                gap:
                  '24px',

                flexWrap:
                  'wrap',
              }}
            >
              <div>
                <p
                  className="eyebrow"
                >
                  SUPPLIER MASTER
                </p>

                <h2
                  style={{
                    margin:
                      '4px 0 6px',

                    fontSize:
                      '18px',

                    color:
                      '#173354',
                  }}
                >
                  Supplier Overview
                </h2>

                <p
                  style={{
                    margin:
                      0,

                    color:
                      '#71869d',

                    fontSize:
                      '13px',
                  }}
                >
                  Core supplier identification
                  and current status.
                </p>
              </div>

              <span
                className={
                  supplier.is_active
                    ? 'status-pill status-approved'
                    : 'status-pill status-rejected'
                }
              >
                {
                  supplier.is_active
                    ? 'ACTIVE'
                    : 'INACTIVE'
                }
              </span>
            </div>


            {/* =================================================
                SUMMARY GRID
            ================================================= */}

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(4, minmax(0, 1fr))',

                gap:
                  '16px',

                marginTop:
                  '22px',
              }}
            >
              <SupplierDetailField
                label="Supplier Code"
                value={
                  supplier.supplier_code
                }
              />

              <SupplierDetailField
                label="Supplier Name"
                value={
                  supplier.supplier_name
                }
              />

              <SupplierDetailField
                label="Payment Terms"
                value={
                  supplier.payment_terms ||
                  'Not specified'
                }
              />

              <SupplierDetailField
                label="Status"
                value={
                  supplier.is_active
                    ? 'Active'
                    : 'Inactive'
                }
              />
            </div>
          </div>
        </div>


        {/* =====================================================
            CONTACT DETAILS
        ===================================================== */}

        <div
          className="data-table-card"
          style={{
            marginBottom:
              '18px',
          }}
        >
          <div
            style={{
              padding:
                '22px',
            }}
          >
            <p
              className="eyebrow"
            >
              CONTACT
            </p>

            <h2
              style={{
                margin:
                  '4px 0 6px',

                fontSize:
                  '18px',

                color:
                  '#173354',
              }}
            >
              Contact Information
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  '#71869d',

                fontSize:
                  '13px',
              }}
            >
              Primary supplier contact and
              communication details.
            </p>


            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',

                gap:
                  '16px',

                marginTop:
                  '22px',
              }}
            >
              <SupplierDetailField
                label="Contact Name"
                value={
                  supplier.contact_name ||
                  'Not specified'
                }
              />

              <SupplierDetailField
                label="Email Address"
                value={
                  supplier.email ||
                  'Not specified'
                }
              />

              <SupplierDetailField
                label="Phone"
                value={
                  supplier.phone ||
                  'Not specified'
                }
              />
            </div>
          </div>
        </div>


        {/* =====================================================
            PURCHASING
        ===================================================== */}

        <div
          className="data-table-card"
          style={{
            marginBottom:
              '18px',
          }}
        >
          <div
            style={{
              padding:
                '22px',
            }}
          >
            <p
              className="eyebrow"
            >
              PURCHASING
            </p>

            <h2
              style={{
                margin:
                  '4px 0 6px',

                fontSize:
                  '18px',

                color:
                  '#173354',
              }}
            >
              Commercial Information
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  '#71869d',

                fontSize:
                  '13px',
              }}
            >
              Purchasing terms and supplier
              business information.
            </p>


            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',

                gap:
                  '16px',

                marginTop:
                  '22px',
              }}
            >
              <SupplierDetailField
                label="Payment Terms"
                value={
                  supplier.payment_terms ||
                  'Not specified'
                }
              />

              <SupplierDetailField
                label="Supplier Status"
                value={
                  supplier.is_active
                    ? 'Active'
                    : 'Inactive'
                }
              />

              <div
                style={{
                  gridColumn:
                    '1 / -1',
                }}
              >
                <SupplierDetailField
                  label="Supplier Address"
                  value={
                    supplier.address ||
                    'No supplier address recorded.'
                  }
                />
              </div>
            </div>
          </div>
        </div>


        {/* =====================================================
            ACTIVITY
        ===================================================== */}

        <div
          className="data-table-card"
          style={{
            marginBottom:
              '36px',
          }}
        >
          <div
            style={{
              padding:
                '22px',
            }}
          >
            <p
              className="eyebrow"
            >
              ACTIVITY
            </p>

            <h2
              style={{
                margin:
                  '4px 0 6px',

                fontSize:
                  '18px',

                color:
                  '#173354',
              }}
            >
              Record Information
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  '#71869d',

                fontSize:
                  '13px',
              }}
            >
              Supplier record audit
              information currently available
              from NEXORA.
            </p>


            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(2, minmax(0, 1fr))',

                gap:
                  '16px',

                marginTop:
                  '22px',
              }}
            >
              <SupplierDetailField
                label="Created"
                value={
                  formatDateTime(
                    supplier.created_at,
                  )
                }
              />

              <SupplierDetailField
                label="Last Updated"
                value={
                  formatDateTime(
                    supplier.updated_at,
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>
    )
  }


  // ============================================================
  // CREATE / EDIT FORM
  // ============================================================

  const isEditing =
    pageMode === 'EDIT'


  return (
    <section
      className="management-page"
    >
      {/* =======================================================
          HEADER
      ======================================================= */}

      <div
        className="management-page-header"
      >
        <div>
          <p
            className="eyebrow"
          >
            PROCUREMENT / SUPPLIERS
          </p>

          <h1>
            {
              isEditing
                ? 'Edit Supplier'
                : 'Create Supplier'
            }
          </h1>

          <p>
            {
              isEditing &&
              selectedSupplier
                ? `Maintain supplier master data for ${selectedSupplier.supplier_code}.`
                : 'Create a new supplier for purchasing and procurement transactions.'
            }
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={
            isEditing &&
            selectedSupplier
              ? () =>
                  openSupplierDetails(
                    selectedSupplier,
                  )
              : openSupplierList
          }
        >
          ← {
            isEditing
              ? 'Back to Supplier'
              : 'Back to Suppliers'
          }
        </button>
      </div>


      {/* =======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div
          className="page-message error"
          role="alert"
        >
          {error}
        </div>
      )}


      {/* =======================================================
          FORM
      ======================================================= */}

      <form
        className="supplier-master-form"
        noValidate
        onSubmit={
          handleSubmit
        }
      >

        {/* =====================================================
            GENERAL INFORMATION
        ===================================================== */}

        <div
          className="data-table-card supplier-form-section"
        >
          <div
            className="supplier-form-section-header"
          >
            <div>
              <p
                className="eyebrow"
              >
                GENERAL INFORMATION
              </p>

              <h2>
                Supplier Information
              </h2>

              <p>
                Core supplier identification
                and master-data information.
              </p>
            </div>

            {isEditing && (
              <span
                className={
                  form.is_active
                    ? 'status-pill status-approved'
                    : 'status-pill status-rejected'
                }
              >
                {
                  form.is_active
                    ? 'ACTIVE'
                    : 'INACTIVE'
                }
              </span>
            )}
          </div>


          <div
            className="supplier-form-grid"
          >
            <label>
              <span>
                Supplier Code *
              </span>

              <input
                type="text"
                data-supplier-field="supplier_code"
                maxLength={
                  50
                }
                placeholder="e.g. SUP-001"
                value={
                  form.supplier_code
                }
                disabled={
                  isEditing
                }
                className={
                  fieldErrors.supplier_code
                    ? 'field-error'
                    : ''
                }
                onChange={
                  (event) => {
                    clearFieldError(
                      'supplier_code',
                    )

                    setForm({
                      ...form,

                      supplier_code:
                        event.target.value.toUpperCase(),
                    })
                  }
                }
              />

              {fieldErrors.supplier_code && (
                <span className="field-error-message">
                  {
                    fieldErrors.supplier_code
                  }
                </span>
              )}

              <small>
                Unique supplier identifier
                used throughout procurement.
              </small>
            </label>


            <label>
              <span>
                Supplier Name *
              </span>

              <input
                type="text"
                data-supplier-field="supplier_name"
                placeholder="Enter legal or trading name"
                value={
                  form.supplier_name
                }
                className={
                  fieldErrors.supplier_name
                    ? 'field-error'
                    : ''
                }
                onChange={
                  (event) => {
                    clearFieldError(
                      'supplier_name',
                    )

                    setForm({
                      ...form,

                      supplier_name:
                        event.target.value,
                    })
                  }
                }
              />

              {fieldErrors.supplier_name && (
                <span className="field-error-message">
                  {
                    fieldErrors.supplier_name
                  }
                </span>
              )}
            </label>
          </div>
        </div>


        {/* =====================================================
            CONTACT
        ===================================================== */}

        <div
          className="data-table-card supplier-form-section"
        >
          <div
            className="supplier-form-section-header"
          >
            <div>
              <p
                className="eyebrow"
              >
                CONTACT
              </p>

              <h2>
                Contact Information
              </h2>

              <p>
                Primary contact details used
                by the purchasing team.
              </p>
            </div>
          </div>


          <div
            className="supplier-form-grid"
          >
            <label>
              <span>
                Contact Name
              </span>

              <input
                type="text"
                placeholder="Primary supplier contact"
                value={
                  form.contact_name
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      contact_name:
                        event.target.value,
                    })
                }
              />
            </label>


            <label>
              <span>
                Email Address
              </span>

              <input
                type="email"
                data-supplier-field="email"
                placeholder="purchasing@supplier.com"
                value={
                  form.email
                }
                className={
                  fieldErrors.email
                    ? 'field-error'
                    : ''
                }
                onChange={
                  (event) => {
                    clearFieldError(
                      'email',
                    )

                    setForm({
                      ...form,

                      email:
                        event.target.value,
                    })
                  }
                }
              />

              {fieldErrors.email && (
                <span className="field-error-message">
                  {
                    fieldErrors.email
                  }
                </span>
              )}
            </label>


            <label>
              <span>
                Phone
              </span>

              <input
                type="tel"
                placeholder="+61 ..."
                value={
                  form.phone
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      phone:
                        event.target.value,
                    })
                }
              />
            </label>
          </div>
        </div>


        {/* =====================================================
            COMMERCIAL
        ===================================================== */}

        <div
          className="data-table-card supplier-form-section"
        >
          <div
            className="supplier-form-section-header"
          >
            <div>
              <p
                className="eyebrow"
              >
                COMMERCIAL
              </p>

              <h2>
                Purchasing Information
              </h2>

              <p>
                Commercial settings used when
                purchasing from this supplier.
              </p>
            </div>
          </div>


          <div
            className="supplier-form-grid"
          >
            <label>
              <span>
                Payment Terms
              </span>

              <select
                value={
                  form.payment_terms
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      payment_terms:
                        event.target.value,
                    })
                }
              >
                <option
                  value=""
                >
                  Select payment terms
                </option>

                <option
                  value="PREPAID"
                >
                  Prepaid
                </option>

                <option
                  value="COD"
                >
                  Cash on Delivery
                </option>

                <option
                  value="NET7"
                >
                  Net 7 Days
                </option>

                <option
                  value="NET14"
                >
                  Net 14 Days
                </option>

                <option
                  value="NET30"
                >
                  Net 30 Days
                </option>

                <option
                  value="NET45"
                >
                  Net 45 Days
                </option>

                <option
                  value="NET60"
                >
                  Net 60 Days
                </option>

                <option
                  value="NET90"
                >
                  Net 90 Days
                </option>
              </select>
            </label>


            {isEditing && (
              <label>
                <span>
                  Supplier Status
                </span>

                <select
                  value={
                    form.is_active
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                  onChange={
                    (event) =>
                      setForm({
                        ...form,

                        is_active:
                          event.target.value ===
                          'ACTIVE',
                      })
                  }
                >
                  <option
                    value="ACTIVE"
                  >
                    Active
                  </option>

                  <option
                    value="INACTIVE"
                  >
                    Inactive
                  </option>
                </select>
              </label>
            )}


            <label
              className="form-field-full"
            >
              <span>
                Supplier Address
              </span>

              <textarea
                rows={
                  4
                }
                placeholder="Enter supplier business or delivery address"
                value={
                  form.address
                }
                onChange={
                  (event) =>
                    setForm({
                      ...form,

                      address:
                        event.target.value,
                    })
                }
              />
            </label>
          </div>
        </div>


        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div
          className="supplier-form-footer"
        >
          <div>
            <p>
              Fields marked with * are
              required.
            </p>
          </div>


          <div
            className="form-actions"
          >
            <button
              type="button"
              className="secondary-action-button"
              disabled={
                isSaving
              }
              onClick={
                isEditing &&
                selectedSupplier
                  ? () =>
                      openSupplierDetails(
                        selectedSupplier,
                      )
                  : openSupplierList
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
              {
                isSaving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Supplier'
              }
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}


// ============================================================
// DETAIL FIELD COMPONENT
// ============================================================

type SupplierDetailFieldProps = {
  label: string
  value: string
}


function SupplierDetailField({
  label,
  value,
}: SupplierDetailFieldProps) {
  return (
    <div
      style={{
        minWidth:
          0,

        padding:
          '14px 16px',

        border:
          '1px solid #e1e9f2',

        borderRadius:
          '9px',

        background:
          '#f8fafc',
      }}
    >
      <span
        style={{
          display:
            'block',

          marginBottom:
            '6px',

          color:
            '#71869d',

          fontSize:
            '10.5px',

          fontWeight:
            750,

          letterSpacing:
            '0.055em',

          textTransform:
            'uppercase',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display:
            'block',

          color:
            '#173354',

          fontSize:
            '13.5px',

          fontWeight:
            650,

          lineHeight:
            1.45,

          overflowWrap:
            'anywhere',
        }}
      >
        {value}
      </strong>
    </div>
  )
}


// ============================================================
// DATE FORMATTER
// ============================================================

function formatDateTime(
  value?: string,
) {
  if (!value) {
    return 'Not available'
  }

  const date =
    new Date(value)

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


export default SuppliersPage