import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createCatalogueItem,
  getCatalogueCategories,
  getCatalogueItems,
  getCatalogueUoms,
  getSuppliers,
  getSupplierItemsForCatalogueItem,
  linkSupplierToCatalogueItem,
  updateCatalogueItem,
  updateSupplierItem,
} from '../../api/procurementapi'

import type {
  CatalogueItem,
  ItemCategory,
  Supplier,
  SupplierItem,
  UnitOfMeasure,
} from '../../types/procurement'


type CatalogueFormState = {
  item_code: string
  item_name: string
  item_type: string
  category_id: number
  purchase_uom_id: number
  stock_uom_id: number | null
  conversion_factor: number | null
  shelf_life_days: number | null
  storage_condition: string
  batch_tracking_required: boolean
  expiry_tracking_required: boolean
  allergen_information: string
  country_of_origin: string
  status: string
}


type CatalogueFieldErrors = {
  item_code?: string
  item_name?: string
  category_id?: string
  purchase_uom_id?: string
  conversion_factor?: string
  shelf_life_days?: string
  status?: string
}


type SupplierPricingFieldErrors = {
  supplier_id?: string
  purchase_uom_id?: string
  unit_price?: string
  currency_code?: string
  minimum_order_quantity?: string
  lead_time_days?: string
  effective_from?: string
  effective_to?: string
}


type SupplierLinkFormState = {
  supplier_id: number
  supplier_item_code: string
  purchase_uom_id: number
  unit_price: number | null
  currency_code: string
  minimum_order_quantity: number | null
  lead_time_days: number | null
  preferred_supplier: boolean
  effective_from: string
  effective_to: string
  active: boolean
}


const emptyCatalogueForm: CatalogueFormState = {
  item_code: '',
  item_name: '',
  item_type: 'RAW_MATERIAL',
  category_id: 0,
  purchase_uom_id: 0,
  stock_uom_id: null,
  conversion_factor: 1,
  shelf_life_days: null,
  storage_condition: '',
  batch_tracking_required: false,
  expiry_tracking_required: false,
  allergen_information: '',
  country_of_origin: '',
  status: 'ACTIVE',
}


const emptySupplierLinkForm: SupplierLinkFormState = {
  supplier_id: 0,
  supplier_item_code: '',
  purchase_uom_id: 0,
  unit_price: null,
  currency_code: 'AUD',
  minimum_order_quantity: null,
  lead_time_days: null,
  preferred_supplier: false,
  effective_from:
    new Date().toISOString().slice(0, 10),
  effective_to: '',
  active: true,
}


function CataloguePage() {
  const [items, setItems] =
    useState<CatalogueItem[]>([])

  const [categories, setCategories] =
    useState<ItemCategory[]>([])

  const [uoms, setUoms] =
    useState<UnitOfMeasure[]>([])

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])

  const [search, setSearch] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  const [showItemForm, setShowItemForm] =
    useState(false)

const [editingItem, setEditingItem] =
  useState<CatalogueItem | null>(null)

const [viewingItem, setViewingItem] =
  useState<CatalogueItem | null>(null)

  const [
  viewingSupplierLinks,
  setViewingSupplierLinks,
] = useState<SupplierItem[]>([])

const [itemForm, setItemForm] =
  useState<CatalogueFormState>(
    emptyCatalogueForm,
  )

  const [
    itemFieldErrors,
    setItemFieldErrors,
  ] = useState<CatalogueFieldErrors>({})

  const [
    showSupplierModal,
    setShowSupplierModal,
  ] = useState(false)

  const [selectedItem, setSelectedItem] =
    useState<CatalogueItem | null>(null)

  const [supplierLinks, setSupplierLinks] =
    useState<SupplierItem[]>([])

  const [
    editingSupplierLink,
    setEditingSupplierLink,
  ] = useState<SupplierItem | null>(null)

  const [
    supplierLinkForm,
    setSupplierLinkForm,
  ] = useState<SupplierLinkFormState>(
    emptySupplierLinkForm,
  )

  const [
    supplierPricingFieldErrors,
    setSupplierPricingFieldErrors,
  ] = useState<SupplierPricingFieldErrors>({})


  const loadData = async () => {
    try {
      setIsLoading(true)
      setError('')

      const [
        itemData,
        categoryData,
        uomData,
        supplierData,
      ] = await Promise.all([
        getCatalogueItems(),
        getCatalogueCategories(),
        getCatalogueUoms(),
        getSuppliers(),
      ])

      setItems(itemData)
      setCategories(categoryData)
      setUoms(uomData)
      setSuppliers(supplierData)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load catalogue data.',
      )
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    void loadData()
  }, [])


  const filteredItems = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    if (!query) {
      return items
    }

    return items.filter((item) =>
      [
        item.item_code,
        item.item_name,
        item.item_type,
        item.status,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(query),
      ),
    )
  }, [items, search])


  const getCategoryName = (
    categoryId: number,
  ) => {
    return (
      categories.find(
        (category) =>
          category.category_id ===
          categoryId,
      )?.category_name ?? '—'
    )
  }


  const getUomCode = (
    uomId: number | null,
  ) => {
    if (!uomId) {
      return '—'
    }

    return (
      uoms.find(
        (uom) =>
          uom.uom_id === uomId,
      )?.uom_code ?? '—'
    )
  }


  const getUomName = (
    uomId: number | null,
  ) => {
    if (!uomId) {
      return '—'
    }

    const uom = uoms.find(
      (unit) =>
        unit.uom_id === uomId,
    )

    if (!uom) {
      return '—'
    }

    return `${uom.uom_code} — ${uom.uom_name}`
  }


  const formatDate = (
    value: string | null,
  ) => {
    if (!value) {
      return '—'
    }

    const date = new Date(
      `${value}T00:00:00`,
    )

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat(
      'en-AU',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    ).format(date)
  }


  const handleNewItem = () => {
    setEditingItem(null)

    setItemForm({
      ...emptyCatalogueForm,
      category_id:
        categories[0]?.category_id ?? 0,
      purchase_uom_id:
        uoms[0]?.uom_id ?? 0,
      stock_uom_id:
        uoms[0]?.uom_id ?? null,
    })

    setError('')
    setSuccessMessage('')
    setItemFieldErrors({})
    setShowItemForm(true)
  }


  const handleEditItem = (
    item: CatalogueItem,
  ) => {
    setEditingItem(item)

    setItemForm({
      item_code: item.item_code,
      item_name: item.item_name,
      item_type: item.item_type,
      category_id: item.category_id,
      purchase_uom_id:
        item.purchase_uom_id,
      stock_uom_id:
        item.stock_uom_id,
      conversion_factor:
        item.conversion_factor !== null
          ? Number(
              item.conversion_factor,
            )
          : null,
      shelf_life_days:
        item.shelf_life_days,
      storage_condition:
        item.storage_condition ?? '',
      batch_tracking_required:
        item.batch_tracking_required,
      expiry_tracking_required:
        item.expiry_tracking_required,
      allergen_information:
        item.allergen_information ?? '',
      country_of_origin:
        item.country_of_origin ?? '',
      status:
        item.status,
    })

    setError('')
    setSuccessMessage('')
    setItemFieldErrors({})
    setShowItemForm(true)
  }


  const handleCloseItemForm = () => {
    setShowItemForm(false)
    setEditingItem(null)
    setItemFieldErrors({})
    setItemForm(
      emptyCatalogueForm,
    )
  }


  const handleItemSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setSuccessMessage('')

    const validationErrors:
      CatalogueFieldErrors = {}

    if (!itemForm.item_code.trim()) {
      validationErrors.item_code =
        'Item code is required.'
    }

    if (!itemForm.item_name.trim()) {
      validationErrors.item_name =
        'Item name is required.'
    }

    if (itemForm.category_id <= 0) {
      validationErrors.category_id =
        'Category is required.'
    }

    if (
      itemForm.purchase_uom_id <= 0
    ) {
      validationErrors.purchase_uom_id =
        'Purchase UOM is required.'
    }

    if (
      itemForm.conversion_factor !==
        null &&
      itemForm.conversion_factor <= 0
    ) {
      validationErrors.conversion_factor =
        'Conversion factor must be greater than zero.'
    }

    if (
      itemForm.shelf_life_days !==
        null &&
      itemForm.shelf_life_days < 0
    ) {
      validationErrors.shelf_life_days =
        'Shelf life cannot be negative.'
    }

    if (
      editingItem &&
      !['ACTIVE', 'INACTIVE'].includes(
        itemForm.status,
      )
    ) {
      validationErrors.status =
        'A valid item status is required.'
    }

    setItemFieldErrors(
      validationErrors,
    )

    const validationCount =
      Object.keys(
        validationErrors,
      ).length

    if (validationCount > 0) {
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
              `[data-catalogue-field="${firstField}"]`,
            ) as HTMLElement | null

          element?.focus()
        },
      )

      return
    }

    try {
      if (editingItem) {
        await updateCatalogueItem(
          editingItem.catalogue_item_id,
          {
            item_name:
              itemForm.item_name.trim(),
            item_type:
              itemForm.item_type,
            category_id:
              itemForm.category_id,
            purchase_uom_id:
              itemForm.purchase_uom_id,
            stock_uom_id:
              itemForm.stock_uom_id,
            conversion_factor:
              itemForm.conversion_factor,
            shelf_life_days:
              itemForm.shelf_life_days,
            storage_condition:
              itemForm.storage_condition.trim() ||
              null,
            batch_tracking_required:
              itemForm.batch_tracking_required,
            expiry_tracking_required:
              itemForm.expiry_tracking_required,
            allergen_information:
              itemForm.allergen_information.trim() ||
              null,
            country_of_origin:
              itemForm.country_of_origin.trim() ||
              null,
            status:
              itemForm.status,
            updated_by: 1,
          },
        )

        setSuccessMessage(
          'Catalogue item updated successfully.',
        )
      } else {
        await createCatalogueItem({
          item_code:
            itemForm.item_code
              .trim()
              .toUpperCase(),
          item_name:
            itemForm.item_name.trim(),
          item_type:
            itemForm.item_type,
          category_id:
            itemForm.category_id,
          purchase_uom_id:
            itemForm.purchase_uom_id,
          stock_uom_id:
            itemForm.stock_uom_id,
          conversion_factor:
            itemForm.conversion_factor,
          shelf_life_days:
            itemForm.shelf_life_days,
          storage_condition:
            itemForm.storage_condition.trim() ||
            null,
          batch_tracking_required:
            itemForm.batch_tracking_required,
          expiry_tracking_required:
            itemForm.expiry_tracking_required,
          allergen_information:
            itemForm.allergen_information.trim() ||
            null,
          country_of_origin:
            itemForm.country_of_origin.trim() ||
            null,
          created_by: 1,
          updated_by: 1,
        })

        setSuccessMessage(
          'Catalogue item created successfully.',
        )
      }

      setItemFieldErrors({})
      await loadData()
      handleCloseItemForm()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save catalogue item.',
      )
    }
  }

  const handleOpenSuppliers = async (
    item: CatalogueItem,
  ) => {
    try {
      setSelectedItem(item)
      setError('')
      setSuccessMessage('')
      setSupplierPricingFieldErrors({})
      setEditingSupplierLink(null)

      const links =
        await getSupplierItemsForCatalogueItem(
          item.catalogue_item_id,
        )

      setSupplierLinks(links)

      setSupplierLinkForm({
        ...emptySupplierLinkForm,
        purchase_uom_id:
          item.purchase_uom_id,
      })

      setShowSupplierModal(true)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load supplier pricing.',
      )
    }
  }


  const handleCloseSupplierModal = () => {
    setShowSupplierModal(false)
    setSelectedItem(null)
    setEditingSupplierLink(null)
    setSupplierPricingFieldErrors({})
    setSupplierLinks([])
    setSupplierLinkForm(
      emptySupplierLinkForm,
    )
  }


  const handleEditSupplierLink = (
    link: SupplierItem,
  ) => {
    setEditingSupplierLink(link)
    setError('')
    setSuccessMessage('')
    setSupplierPricingFieldErrors({})

    setSupplierLinkForm({
      supplier_id:
        link.supplier_id,
      supplier_item_code:
        link.supplier_item_code ?? '',
      purchase_uom_id:
        link.purchase_uom_id,
      unit_price:
        link.unit_price !== null
          ? Number(link.unit_price)
          : null,
      currency_code:
        link.currency_code,
      minimum_order_quantity:
        link.minimum_order_quantity !==
        null
          ? Number(
              link.minimum_order_quantity,
            )
          : null,
      lead_time_days:
        link.lead_time_days,
      preferred_supplier:
        link.preferred_supplier,
      effective_from:
        link.effective_from,
      effective_to:
        link.effective_to ?? '',
      active:
        link.active,
    })
  }


  const handleCancelSupplierEdit = () => {
    if (!selectedItem) {
      return
    }

    setEditingSupplierLink(null)
    setError('')
    setSupplierPricingFieldErrors({})

    setSupplierLinkForm({
      ...emptySupplierLinkForm,
      purchase_uom_id:
        selectedItem.purchase_uom_id,
    })
  }


  const handleSupplierLinkSubmit = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!selectedItem) {
      return
    }

    setError('')
    setSuccessMessage('')

    const validationErrors:
      SupplierPricingFieldErrors = {}

    if (
      supplierLinkForm.supplier_id <= 0
    ) {
      validationErrors.supplier_id =
        'Supplier is required.'
    }

    if (
      supplierLinkForm.purchase_uom_id <=
      0
    ) {
      validationErrors.purchase_uom_id =
        'Purchase UOM is required.'
    }

    if (
      supplierLinkForm.unit_price ===
        null ||
      supplierLinkForm.unit_price <= 0
    ) {
      validationErrors.unit_price =
        'Unit price must be greater than zero.'
    }

    const currencyCode =
      supplierLinkForm.currency_code
        .trim()
        .toUpperCase()

    if (!currencyCode) {
      validationErrors.currency_code =
        'Currency is required.'
    } else if (
      currencyCode.length !== 3
    ) {
      validationErrors.currency_code =
        'Currency must be a 3-letter code.'
    }

    if (
      supplierLinkForm
        .minimum_order_quantity !==
        null &&
      supplierLinkForm
        .minimum_order_quantity <= 0
    ) {
      validationErrors.minimum_order_quantity =
        'Minimum order quantity must be greater than zero.'
    }

    if (
      supplierLinkForm.lead_time_days !==
        null &&
      supplierLinkForm.lead_time_days < 0
    ) {
      validationErrors.lead_time_days =
        'Lead time cannot be negative.'
    }

    if (
      !supplierLinkForm.effective_from
    ) {
      validationErrors.effective_from =
        'Effective From date is required.'
    }

    if (
      supplierLinkForm.effective_to &&
      supplierLinkForm.effective_from &&
      supplierLinkForm.effective_to <
        supplierLinkForm.effective_from
    ) {
      validationErrors.effective_to =
        'Effective To date cannot be earlier than Effective From date.'
    }

    setSupplierPricingFieldErrors(
      validationErrors,
    )

    const validationCount =
      Object.keys(
        validationErrors,
      ).length

    if (validationCount > 0) {
      setError(
        `Please correct ${validationCount} highlighted pricing field${
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
              `[data-pricing-field="${firstField}"]`,
            ) as HTMLElement | null

          element?.focus()
        },
      )

      return
    }

    const validUnitPrice =
      supplierLinkForm.unit_price

    if (validUnitPrice === null) {
      return
    }

    try {
      if (editingSupplierLink) {
        await updateSupplierItem(
          editingSupplierLink.supplier_item_id,
          {
            supplier_item_code:
              supplierLinkForm
                .supplier_item_code
                .trim() ||
              null,
            purchase_uom_id:
              supplierLinkForm
                .purchase_uom_id,
            unit_price:
              validUnitPrice,
            currency_code:
              currencyCode,
            minimum_order_quantity:
              supplierLinkForm
                .minimum_order_quantity,
            lead_time_days:
              supplierLinkForm
                .lead_time_days,
            preferred_supplier:
              supplierLinkForm
                .preferred_supplier,
            effective_from:
              supplierLinkForm
                .effective_from,
            effective_to:
              supplierLinkForm
                .effective_to ||
              null,
            active:
              supplierLinkForm.active,
            updated_by: 1,
          },
        )

        setSuccessMessage(
          'Supplier pricing updated successfully.',
        )
      } else {
        await linkSupplierToCatalogueItem(
          selectedItem.catalogue_item_id,
          {
            supplier_id:
              supplierLinkForm
                .supplier_id,
            supplier_item_code:
              supplierLinkForm
                .supplier_item_code
                .trim() ||
              null,
            purchase_uom_id:
              supplierLinkForm
                .purchase_uom_id,
            unit_price:
              validUnitPrice,
            currency_code:
              currencyCode,
            minimum_order_quantity:
              supplierLinkForm
                .minimum_order_quantity,
            lead_time_days:
              supplierLinkForm
                .lead_time_days,
            preferred_supplier:
              supplierLinkForm
                .preferred_supplier,
            effective_from:
              supplierLinkForm
                .effective_from,
            effective_to:
              supplierLinkForm
                .effective_to ||
              null,
            active:
              supplierLinkForm.active,
            created_by: 1,
            updated_by: 1,
          },
        )

        setSuccessMessage(
          'Supplier linked successfully.',
        )
      }

      const refreshed =
        await getSupplierItemsForCatalogueItem(
          selectedItem.catalogue_item_id,
        )

      setSupplierLinks(refreshed)
      setEditingSupplierLink(null)
      setSupplierPricingFieldErrors({})

      setSupplierLinkForm({
        ...emptySupplierLinkForm,
        purchase_uom_id:
          selectedItem.purchase_uom_id,
      })
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save supplier pricing.',
      )
    }
  }
if (viewingItem) {
  return (
    <section className="management-page catalogue-full-form-page">
      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            PROCUREMENT / MASTER DATA / CATALOGUE
          </p>

          <h1>
            Catalogue Item Details
          </h1>

          <p>
            Review catalogue master data and purchasing configuration.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={() => {
            setViewingSupplierLinks([])
            setViewingItem(null)
          }}
        >
          ← Back to Catalogue
        </button>
      </div>

      <section className="erp-form-card">
        <div className="erp-form-card-header">
          <p className="eyebrow">
            ITEM MASTER
          </p>

          <h2>
            {viewingItem.item_name}
          </h2>

          <p>
            {viewingItem.item_code}
          </p>
        </div>

        <div className="erp-form-body">
          <div className="supplier-item-summary-grid">
            <div>
              <span>Item Code</span>
              <strong>
                {viewingItem.item_code}
              </strong>
            </div>

            <div>
              <span>Item Name</span>
              <strong>
                {viewingItem.item_name}
              </strong>
            </div>

            <div>
              <span>Item Type</span>
              <strong>
                {viewingItem.item_type.replaceAll(
                  '_',
                  ' ',
                )}
              </strong>
            </div>

            <div>
              <span>Category</span>
              <strong>
                {getCategoryName(
                  viewingItem.category_id,
                )}
              </strong>
            </div>

            <div>
              <span>Purchase UOM</span>
              <strong>
                {getUomName(
                  viewingItem.purchase_uom_id,
                )}
              </strong>
            </div>

            <div>
              <span>Stock UOM</span>
              <strong>
                {getUomName(
                  viewingItem.stock_uom_id,
                )}
              </strong>
            </div>

            <div>
              <span>Conversion Factor</span>
              <strong>
                {viewingItem.conversion_factor ??
                  '—'}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {viewingItem.status}
              </strong>
            </div>

            <div>
              <span>Batch Tracking</span>
              <strong>
                {viewingItem.batch_tracking_required
                  ? 'Required'
                  : 'Not Required'}
              </strong>
            </div>

            <div>
              <span>Expiry Tracking</span>
              <strong>
                {viewingItem.expiry_tracking_required
                  ? 'Required'
                  : 'Not Required'}
              </strong>
            </div>

            <div>
              <span>Shelf Life</span>
              <strong>
                {viewingItem.shelf_life_days !==
                null
                  ? `${viewingItem.shelf_life_days} days`
                  : '—'}
              </strong>
            </div>

            <div>
              <span>Country of Origin</span>
              <strong>
                {viewingItem.country_of_origin ||
                  '—'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="erp-form-card">
        <div className="erp-form-card-header">
          <p className="eyebrow">
            STORAGE & COMPLIANCE
          </p>

          <h2>
            Product Information
          </h2>
        </div>

        <div className="erp-form-body">
          <div className="supplier-item-summary-grid">
            <div>
              <span>Storage Condition</span>
              <strong>
                {viewingItem.storage_condition ||
                  '—'}
              </strong>
            </div>

            <div>
              <span>Allergen Information</span>
              <strong>
                {viewingItem.allergen_information ||
                  '—'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="erp-form-card">
        <div className="erp-form-card-header">
          <p className="eyebrow">
            SUPPLIER PRICING
          </p>

          <h2>
            Purchasing Sources
          </h2>

          <p>
            Supplier-specific pricing and commercial terms for this catalogue item.
          </p>
        </div>

        <div className="erp-form-body">
          {viewingSupplierLinks.length === 0 ? (
            <div className="supplier-empty-state">
              No supplier pricing configured for this item.
            </div>
          ) : (
            <div className="supplier-full-page-list">
              {viewingSupplierLinks.map(
                (link) => {
                  const supplier =
                    suppliers.find(
                      (supplierItem) =>
                        supplierItem.supplier_id ===
                        link.supplier_id,
                    )

                  return (
                    <article
                      key={link.supplier_item_id}
                      className="supplier-full-page-card"
                    >
                      <div className="supplier-link-card-header">
                        <div>
                          <strong className="supplier-link-name">
                            {supplier?.supplier_name ??
                              `Supplier #${link.supplier_id}`}
                          </strong>

                          <span className="supplier-link-code">
                            {supplier?.supplier_code ??
                              ''}
                          </span>
                        </div>

                        <div className="supplier-link-badges">
                          {link.preferred_supplier && (
                            <span className="status-pill status-approved">
                              PREFERRED
                            </span>
                          )}

                          <span
                            className={
                              link.active
                                ? 'status-pill status-approved'
                                : 'status-pill status-rejected'
                            }
                          >
                            {link.active
                              ? 'ACTIVE'
                              : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="supplier-link-details supplier-link-details-wide">
                        <div>
                          <span>
                            Supplier Item Code
                          </span>

                          <strong>
                            {link.supplier_item_code ??
                              '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Purchase UOM
                          </span>

                          <strong>
                            {getUomName(
                              link.purchase_uom_id,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Unit Price
                          </span>

                          <strong>
                            {link.currency_code}{' '}
                            {Number(
                              link.unit_price,
                            ).toFixed(2)}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Minimum Order Qty
                          </span>

                          <strong>
                            {link.minimum_order_quantity !==
                            null
                              ? Number(
                                  link.minimum_order_quantity,
                                )
                              : '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Lead Time
                          </span>

                          <strong>
                            {link.lead_time_days !==
                            null
                              ? `${link.lead_time_days} days`
                              : '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Effective From
                          </span>

                          <strong>
                            {formatDate(
                              link.effective_from,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Effective To
                          </span>

                          <strong>
                            {formatDate(
                              link.effective_to,
                            )}
                          </strong>
                        </div>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
  // ============================================================
  // FULL PAGE CATALOGUE ITEM CREATE / EDIT
  // ============================================================

  if (showItemForm) {
    return (
      <section className="management-page catalogue-full-form-page">
        <div className="management-page-header">
          <div>
            <p className="eyebrow">
              PROCUREMENT / MASTER DATA / CATALOGUE
            </p>

            <h1>
              {editingItem
                ? 'Edit Catalogue Item'
                : 'Create Catalogue Item'}
            </h1>

            <p>
              {editingItem
                ? 'Update catalogue master data, purchasing units, inventory controls and compliance information.'
                : 'Create a new catalogue master item for purchasing, receiving and inventory operations.'}
            </p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={handleCloseItemForm}
          >
            ← Back to Catalogue
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
          className="catalogue-full-form"
          noValidate
          onSubmit={handleItemSubmit}
        >
          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                GENERAL INFORMATION
              </p>

              <h2>
                Item Identification
              </h2>

              <p>
                Core item master information used throughout procurement and inventory.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid">
                <div className="erp-form-field">
                  <label htmlFor="catalogue-item-code">
                    Item Code *
                  </label>

                  <input
                    id="catalogue-item-code"
                    data-catalogue-field="item_code"
                    type="text"
                    placeholder="e.g. RM-MILKPOWDER-001"
                    value={itemForm.item_code}
                    disabled={Boolean(editingItem)}                    className={
                      itemFieldErrors.item_code
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        item_code:
                          event.target.value.toUpperCase(),
                      })
                    }
                  />

                  {itemFieldErrors.item_code && (
                    <span className="field-error-message">
                      {itemFieldErrors.item_code}
                    </span>
                  )}

                  <small>
                    Unique identifier used across purchasing and inventory.
                  </small>
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-item-name">
                    Item Name *
                  </label>

                  <input
                    id="catalogue-item-name"
                    data-catalogue-field="item_name"
                    type="text"
                    placeholder="Enter catalogue item name"
                    value={itemForm.item_name}                    className={
                      itemFieldErrors.item_name
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        item_name:
                          event.target.value,
                      })
                    }
                  />

                  {itemFieldErrors.item_name && (
                    <span className="field-error-message">
                      {itemFieldErrors.item_name}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-item-type">
                    Item Type *
                  </label>

                  <select
                    id="catalogue-item-type"
                    value={itemForm.item_type}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        item_type:
                          event.target.value,
                      })
                    }
                  >
                    <option value="RAW_MATERIAL">
                      Raw Material
                    </option>
                    <option value="INGREDIENT">
                      Ingredient
                    </option>
                    <option value="PACKAGING_MATERIAL">
                      Packaging Material
                    </option>
                    <option value="CLEANING_MATERIAL">
                      Cleaning Material
                    </option>
                    <option value="MAINTENANCE_ITEM">
                      Maintenance Item
                    </option>
                    <option value="NON_STOCK_ITEM">
                      Non Stock Item
                    </option>
                    <option value="SERVICE">
                      Service
                    </option>
                  </select>
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-category">
                    Category *
                  </label>

                  <select
                    id="catalogue-category"
                    data-catalogue-field="category_id"
                    value={itemForm.category_id}                    className={
                      itemFieldErrors.category_id
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        category_id:
                          Number(event.target.value),
                      })
                    }
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category.category_id}
                          value={category.category_id}
                        >
                          {category.category_code}
                          {' — '}
                          {category.category_name}
                        </option>
                      ),
                    )}
                  </select>

                  {itemFieldErrors.category_id && (
                    <span className="field-error-message">
                      {itemFieldErrors.category_id}
                    </span>
                  )}
                </div>

                {editingItem && (
                  <div className="erp-form-field">
                    <label htmlFor="catalogue-status">
                      Status
                    </label>

                    <select
                      id="catalogue-status"
                      data-catalogue-field="status"
                      value={itemForm.status}
                      className={
                        itemFieldErrors.status
                          ? 'field-error'
                          : ''
                      }
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          status:
                            event.target.value,
                        })
                      }
                    >
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="INACTIVE">
                        Inactive
                      </option>
                    </select>

                  {itemFieldErrors.status && (
                    <span className="field-error-message">
                      {itemFieldErrors.status}
                    </span>
                  )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                UNIT MANAGEMENT
              </p>

              <h2>
                Units of Measure
              </h2>

              <p>
                Configure how the item is purchased, stored and converted.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid three-columns">
                <div className="erp-form-field">
                  <label htmlFor="catalogue-purchase-uom">
                    Purchase UOM *
                  </label>

                  <select
                    id="catalogue-purchase-uom"
                    data-catalogue-field="purchase_uom_id"
                    value={itemForm.purchase_uom_id}                    className={
                      itemFieldErrors.purchase_uom_id
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        purchase_uom_id:
                          Number(event.target.value),
                      })
                    }
                  >
                    {uoms.map(
                      (uom) => (
                        <option
                          key={uom.uom_id}
                          value={uom.uom_id}
                        >
                          {uom.uom_code}
                          {' — '}
                          {uom.uom_name}
                        </option>
                      ),
                    )}
                  </select>

                  {itemFieldErrors.purchase_uom_id && (
                    <span className="field-error-message">
                      {itemFieldErrors.purchase_uom_id}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-stock-uom">
                    Stock UOM
                  </label>

                  <select
                    id="catalogue-stock-uom"
                    value={
                      itemForm.stock_uom_id ??
                      ''
                    }
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        stock_uom_id:
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                      })
                    }
                  >
                    <option value="">
                      Not applicable
                    </option>

                    {uoms.map(
                      (uom) => (
                        <option
                          key={uom.uom_id}
                          value={uom.uom_id}
                        >
                          {uom.uom_code}
                          {' — '}
                          {uom.uom_name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-conversion-factor">
                    Conversion Factor
                  </label>

                  <input
                    id="catalogue-conversion-factor"
                    data-catalogue-field="conversion_factor"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder="1"
                    value={
                      itemForm.conversion_factor ??
                      ''
                    }                    className={
                      itemFieldErrors.conversion_factor
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        conversion_factor:
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                      })
                    }
                  />

                  {itemFieldErrors.conversion_factor && (
                    <span className="field-error-message">
                      {itemFieldErrors.conversion_factor}
                    </span>
                  )}

                  <small>
                    Conversion between purchase UOM and stock UOM.
                  </small>
                </div>
              </div>
            </div>
          </section>

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                INVENTORY CONTROLS
              </p>

              <h2>
                Inventory & Tracking
              </h2>

              <p>
                Define stock handling, traceability and shelf-life requirements.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid">
                <div className="erp-form-field">
                  <label htmlFor="catalogue-shelf-life">
                    Shelf Life (Days)
                  </label>

                  <input
                    id="catalogue-shelf-life"
                    data-catalogue-field="shelf_life_days"
                    type="number"
                    min="0"
                    placeholder="e.g. 365"
                    value={
                      itemForm.shelf_life_days ??
                      ''
                    }                    className={
                      itemFieldErrors.shelf_life_days
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        shelf_life_days:
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                      })
                    }
                  />

                  {itemFieldErrors.shelf_life_days && (
                    <span className="field-error-message">
                      {itemFieldErrors.shelf_life_days}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="catalogue-country-origin">
                    Country of Origin
                  </label>

                  <input
                    id="catalogue-country-origin"
                    type="text"
                    placeholder="e.g. Australia"
                    value={itemForm.country_of_origin}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        country_of_origin:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="erp-form-field full-width">
                  <label htmlFor="catalogue-storage-condition">
                    Storage Condition
                  </label>

                  <input
                    id="catalogue-storage-condition"
                    type="text"
                    placeholder="e.g. Dry storage below 25°C"
                    value={itemForm.storage_condition}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        storage_condition:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="erp-switch-grid">
                <label className="erp-toggle-card">
                  <input
                    type="checkbox"
                    checked={
                      itemForm.batch_tracking_required
                    }
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        batch_tracking_required:
                          event.target.checked,
                      })
                    }
                  />

                  <div>
                    <strong>
                      Batch Tracking
                    </strong>

                    <span>
                      Require batch or lot identification during receipt and inventory movements.
                    </span>
                  </div>
                </label>

                <label className="erp-toggle-card">
                  <input
                    type="checkbox"
                    checked={
                      itemForm.expiry_tracking_required
                    }
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        expiry_tracking_required:
                          event.target.checked,
                      })
                    }
                  />

                  <div>
                    <strong>
                      Expiry Tracking
                    </strong>

                    <span>
                      Require expiry-date capture for this catalogue item.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                PRODUCT INFORMATION
              </p>

              <h2>
                Compliance Information
              </h2>

              <p>
                Record additional product information required by procurement and receiving.
              </p>
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid">
                <div className="erp-form-field full-width">
                  <label htmlFor="catalogue-allergens">
                    Allergen Information
                  </label>

                  <textarea
                    id="catalogue-allergens"
                    rows={4}
                    placeholder="Enter allergen or handling information..."
                    value={itemForm.allergen_information}
                    onChange={(event) =>
                      setItemForm({
                        ...itemForm,
                        allergen_information:
                          event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              ITEM LIFECYCLE / STATUS
          ====================================================== */}

          <section className="erp-form-card">
            <div className="erp-form-card-header">
              <p className="eyebrow">
                ITEM LIFECYCLE
              </p>

              <h2>
                Catalogue Status
              </h2>

              <p>
                Control whether this item can be used for new procurement transactions.
                Historical purchase orders and receipts remain unchanged.
              </p>
            </div>

            <div className="erp-form-body">
              {editingItem ? (
                <div className="erp-form-grid">
                  <div className="erp-form-field">
                    <label htmlFor="catalogue-status">
                      Status *
                    </label>

                    <select
                      id="catalogue-status"
                      value={itemForm.status}
                      onChange={(event) =>
                        setItemForm({
                          ...itemForm,
                          status: event.target.value,
                        })
                      }
                    >
                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>
                    </select>

                    <small>
                      Inactive items remain available for audit and historical records,
                      but should not be selectable on new purchase requests or purchase orders.
                    </small>
                  </div>

                  <div className="erp-form-field">
                    <label>
                      Current Item
                    </label>

                    <div
                      className={
                        itemForm.status === 'ACTIVE'
                          ? 'status-pill status-approved'
                          : 'status-pill status-rejected'
                      }
                      style={{
                        width: 'fit-content',
                        marginTop: '10px',
                      }}
                    >
                      {itemForm.status}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="catalogue-status-information">
                  <span className="status-pill status-approved">
                    ACTIVE
                  </span>

                  <p>
                    New catalogue items are created as Active. After creation, use
                    <strong> Edit </strong>
                    to inactivate the item when it is no longer available for purchasing.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="erp-form-bottom-bar">
            <p>
              Fields marked with * are required.
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleCloseItemForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-action-button"
              >
                {editingItem
                  ? 'Save Changes'
                  : 'Create Catalogue Item'}
              </button>
            </div>
          </div>
        </form>
      </section>
    )
  }


  // ============================================================
  // FULL PAGE SUPPLIER PRICING
  // ============================================================

  if (
    showSupplierModal &&
    selectedItem
  ) {
    return (
      <section className="management-page supplier-pricing-page">
        <div className="management-page-header">
          <div>
            <p className="eyebrow">
              PROCUREMENT / MASTER DATA / CATALOGUE / {selectedItem.item_code}
            </p>

            <h1>
              Supplier Pricing
            </h1>

            <p>
              Manage supplier relationships and supplier-specific purchasing prices for {selectedItem.item_name}.
            </p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={handleCloseSupplierModal}
          >
            ← Back to Catalogue
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

        <section className="erp-form-card">
          <div className="erp-form-card-header supplier-pricing-title-row">
            <div>
              <p className="eyebrow">
                ITEM MASTER
              </p>

              <h2>
                {selectedItem.item_name}
              </h2>

              <p>
                {selectedItem.item_code}
              </p>
            </div>

            <span
              className={
                selectedItem.status ===
                'ACTIVE'
                  ? 'status-pill status-approved'
                  : 'status-pill status-rejected'
              }
            >
              {selectedItem.status}
            </span>
          </div>

          <div className="erp-form-body">
            <div className="supplier-item-summary-grid">
              <div>
                <span>
                  Item Code
                </span>

                <strong>
                  {selectedItem.item_code}
                </strong>
              </div>

              <div>
                <span>
                  Category
                </span>

                <strong>
                  {getCategoryName(
                    selectedItem.category_id,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Purchase UOM
                </span>

                <strong>
                  {getUomName(
                    selectedItem.purchase_uom_id,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Linked Suppliers
                </span>

                <strong>
                  {supplierLinks.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-form-card">
          <div className="erp-form-card-header">
            <p className="eyebrow">
              COMMERCIAL DATA
            </p>

            <h2>
              Linked Suppliers
            </h2>

            <p>
              Existing supplier relationships and current commercial terms for this catalogue item.
            </p>
          </div>

          <div className="erp-form-body">
            {supplierLinks.length ===
            0 ? (
              <div className="supplier-empty-state">
                No suppliers linked yet.
              </div>
            ) : (
              <div className="supplier-full-page-list">
                {supplierLinks.map(
                  (link) => {
                    const supplier =
                      suppliers.find(
                        (
                          supplierItem,
                        ) =>
                          supplierItem.supplier_id ===
                          link.supplier_id,
                      )

                    return (
                      <article
                        className="supplier-full-page-card"
                        key={link.supplier_item_id}
                      >
                        <div className="supplier-link-card-header">
                          <div>
                            <strong className="supplier-link-name">
                              {supplier?.supplier_name ??
                                `Supplier #${link.supplier_id}`}
                            </strong>

                            <span className="supplier-link-code">
                              {supplier?.supplier_code ??
                                ''}
                            </span>
                          </div>

                          <div className="supplier-link-badges">
                            {link.preferred_supplier && (
                              <span className="status-pill status-approved">
                                PREFERRED
                              </span>
                            )}

                            <span
                              className={
                                link.active
                                  ? 'status-pill status-approved'
                                  : 'status-pill status-rejected'
                              }
                            >
                              {link.active
                                ? 'ACTIVE'
                                : 'INACTIVE'}
                            </span>
                          </div>
                        </div>

                        <div className="supplier-link-details supplier-link-details-wide">
                          <div>
                            <span>
                              Supplier Item Code
                            </span>
                            <strong>
                              {link.supplier_item_code ??
                                '—'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Purchase UOM
                            </span>
                            <strong>
                              {getUomName(
                                link.purchase_uom_id,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Unit Price
                            </span>
                            <strong>
                              {link.currency_code}{' '}
                              {Number(
                                link.unit_price,
                              ).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Minimum Order Qty
                            </span>
                            <strong>
                              {link.minimum_order_quantity !==
                              null
                                ? Number(
                                    link.minimum_order_quantity,
                                  )
                                : '—'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Lead Time
                            </span>
                            <strong>
                              {link.lead_time_days !==
                              null
                                ? `${link.lead_time_days} days`
                                : '—'}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Effective From
                            </span>
                            <strong>
                              {formatDate(
                                link.effective_from,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Effective To
                            </span>
                            <strong>
                              {formatDate(
                                link.effective_to,
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="supplier-link-actions">
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() =>
                              handleEditSupplierLink(
                                link,
                              )
                            }
                          >
                            Edit Pricing
                          </button>
                        </div>
                      </article>
                    )
                  },
                )}
              </div>
            )}
          </div>
        </section>

        <form
          className="catalogue-full-form"
          noValidate
          onSubmit={
            handleSupplierLinkSubmit
          }
        >
          <section className="erp-form-card">
            <div className="erp-form-card-header supplier-pricing-title-row">
              <div>
                <p className="eyebrow">
                  {editingSupplierLink
                    ? 'MAINTAIN PRICING'
                    : 'NEW RELATIONSHIP'}
                </p>

                <h2>
                  {editingSupplierLink
                    ? 'Edit Supplier Pricing'
                    : 'Add Supplier Relationship'}
                </h2>

                <p>
                  Configure supplier-specific purchasing price, UOM, minimum quantity and lead time.
                </p>
              </div>

              {editingSupplierLink && (
                <span className="editing-pricing-badge">
                  Editing pricing
                </span>
              )}
            </div>

            <div className="erp-form-body">
              <div className="erp-form-grid">
                <div className="erp-form-field">
                  <label htmlFor="supplier-pricing-supplier">
                    Supplier *
                  </label>

                  <select
                    id="supplier-pricing-supplier"
                    data-pricing-field="supplier_id"
                    value={
                      supplierLinkForm.supplier_id
                    }
                    disabled={
                      Boolean(
                        editingSupplierLink,
                      )
                    }                    className={
                      supplierPricingFieldErrors.supplier_id
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        supplier_id:
                          Number(event.target.value),
                      })
                    }
                  >
                    <option value={0}>
                      Select supplier
                    </option>

                    {suppliers
                      .filter(
                        (supplier) =>
                          supplier.is_active,
                      )
                      .map(
                        (supplier) => (
                          <option
                            key={supplier.supplier_id}
                            value={supplier.supplier_id}
                          >
                            {supplier.supplier_code}
                            {' — '}
                            {supplier.supplier_name}
                          </option>
                        ),
                      )}
                  </select>

                  {supplierPricingFieldErrors.supplier_id && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.supplier_id}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-item-code">
                    Supplier Item Code
                  </label>

                  <input
                    id="supplier-item-code"
                    type="text"
                    placeholder="Supplier-specific item code"
                    value={
                      supplierLinkForm.supplier_item_code
                    }
                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        supplier_item_code:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-purchase-uom">
                    Purchase UOM *
                  </label>

                  <select
                    id="supplier-purchase-uom"
                    data-pricing-field="purchase_uom_id"
                    value={
                      supplierLinkForm.purchase_uom_id
                    }                    className={
                      supplierPricingFieldErrors.purchase_uom_id
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        purchase_uom_id:
                          Number(event.target.value),
                      })
                    }
                  >
                    {uoms.map(
                      (uom) => (
                        <option
                          key={uom.uom_id}
                          value={uom.uom_id}
                        >
                          {uom.uom_code}
                          {' — '}
                          {uom.uom_name}
                        </option>
                      ),
                    )}
                  </select>

                  {supplierPricingFieldErrors.purchase_uom_id && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.purchase_uom_id}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-unit-price">
                    Unit Price *
                  </label>

                  <input
                    id="supplier-unit-price"
                    data-pricing-field="unit_price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      supplierLinkForm.unit_price ??
                      ''
                    }                    className={
                      supplierPricingFieldErrors.unit_price
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) => {
                      const value =
                        event.target.value

                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        unit_price:
                          value === ''
                            ? null
                            : Number(value),
                      })
                    }}
                  />

                  {supplierPricingFieldErrors.unit_price && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.unit_price}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-currency">
                    Currency *
                  </label>

                  <input
                    id="supplier-currency"
                    data-pricing-field="currency_code"
                    type="text"
                    minLength={3}
                    maxLength={3}
                    value={
                      supplierLinkForm.currency_code
                    }                    className={
                      supplierPricingFieldErrors.currency_code
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        currency_code:
                          event.target.value.toUpperCase(),
                      })
                    }
                  />

                  {supplierPricingFieldErrors.currency_code && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.currency_code}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-moq">
                    Minimum Order Quantity
                  </label>

                  <input
                    id="supplier-moq"
                    data-pricing-field="minimum_order_quantity"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={
                      supplierLinkForm.minimum_order_quantity ??
                      ''
                    }                    className={
                      supplierPricingFieldErrors.minimum_order_quantity
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        minimum_order_quantity:
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                      })
                    }
                  />

                  {supplierPricingFieldErrors.minimum_order_quantity && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.minimum_order_quantity}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-lead-time">
                    Lead Time (Days)
                  </label>

                  <input
                    id="supplier-lead-time"
                    data-pricing-field="lead_time_days"
                    type="number"
                    min="0"
                    value={
                      supplierLinkForm.lead_time_days ??
                      ''
                    }                    className={
                      supplierPricingFieldErrors.lead_time_days
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        lead_time_days:
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                      })
                    }
                  />

                  {supplierPricingFieldErrors.lead_time_days && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.lead_time_days}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-effective-from">
                    Effective From *
                  </label>

                  <input
                    id="supplier-effective-from"
                    data-pricing-field="effective_from"
                    type="date"
                    value={
                      supplierLinkForm.effective_from
                    }                    className={
                      supplierPricingFieldErrors.effective_from
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        effective_from:
                          event.target.value,
                      })
                    }
                  />

                  {supplierPricingFieldErrors.effective_from && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.effective_from}
                    </span>
                  )}
                </div>

                <div className="erp-form-field">
                  <label htmlFor="supplier-effective-to">
                    Effective To
                  </label>

                  <input
                    id="supplier-effective-to"
                    data-pricing-field="effective_to"
                    type="date"
                    min={
                      supplierLinkForm.effective_from
                    }
                    value={
                      supplierLinkForm.effective_to
                    }                    className={
                      supplierPricingFieldErrors.effective_to
                        ? 'field-error'
                        : ''
                    }

                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        effective_to:
                          event.target.value,
                      })
                    }
                  />

                  {supplierPricingFieldErrors.effective_to && (
                    <span className="field-error-message">
                      {supplierPricingFieldErrors.effective_to}
                    </span>
                  )}
                </div>
              </div>

              <div className="erp-switch-grid">
                <label className="erp-toggle-card">
                  <input
                    type="checkbox"
                    checked={
                      supplierLinkForm.preferred_supplier
                    }
                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        preferred_supplier:
                          event.target.checked,
                      })
                    }
                  />

                  <div>
                    <strong>
                      Preferred Supplier
                    </strong>

                    <span>
                      Mark this supplier as the preferred purchasing source for this catalogue item.
                    </span>
                  </div>
                </label>

                <label className="erp-toggle-card">
                  <input
                    type="checkbox"
                    checked={
                      supplierLinkForm.active
                    }
                    onChange={(event) =>
                      setSupplierLinkForm({
                        ...supplierLinkForm,
                        active:
                          event.target.checked,
                      })
                    }
                  />

                  <div>
                    <strong>
                      Active Relationship
                    </strong>

                    <span>
                      Allow this supplier pricing relationship to be used in purchasing.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <div className="erp-form-bottom-bar">
            <div>
              {editingSupplierLink && (
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={
                    handleCancelSupplierEdit
                  }
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-action-button"
                onClick={
                  handleCloseSupplierModal
                }
              >
                Back to Catalogue
              </button>

              <button
                type="submit"
                className="primary-action-button"
              >
                {editingSupplierLink
                  ? 'Save Pricing'
                  : 'Link Supplier'}
              </button>
            </div>
          </div>
        </form>
      </section>
    )
  }


  // ============================================================
  // CATALOGUE LIST
  // ============================================================

  return (
    <section className="management-page">
      <div className="management-page-header">
        <div>
          <p className="eyebrow">
            MASTER DATA
          </p>

          <h1>
            Catalogue Management
          </h1>

          <p>
            Manage procurement items, UOMs, tracking rules and supplier pricing.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={handleNewItem}
        >
          + New Catalogue Item
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
          placeholder="Search catalogue..."
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
            Loading catalogue...
          </p>
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
                    Type
                  </th>
                  <th>
                    Category
                  </th>
                  <th>
                    Purchase UOM
                  </th>
                  <th>
                    Tracking
                  </th>
                  <th>
                    Status
                  </th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredItems.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="table-empty-state"
                    >
                      No catalogue items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(
                    (item) => (
                      <tr
                        key={
                          item.catalogue_item_id
                        }
                      >
                        <td>
                          <strong>
                            {item.item_code}
                          </strong>
                        </td>

                        <td>
                          {item.item_name}
                        </td>

                        <td>
                          {item.item_type.replaceAll(
                            '_',
                            ' ',
                          )}
                        </td>

                        <td>
                          {getCategoryName(
                            item.category_id,
                          )}
                        </td>

                        <td>
                          {getUomCode(
                            item.purchase_uom_id,
                          )}
                        </td>

                        <td>
                          {item.batch_tracking_required
                            ? 'Batch'
                            : '—'}

                          {item.expiry_tracking_required
                            ? ' / Expiry'
                            : ''}
                        </td>

                        <td>
                          <span
                            className={
                              item.status ===
                              'ACTIVE'
                                ? 'status-pill status-approved'
                                : 'status-pill status-rejected'
                            }
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="table-action-cell">
                          <div className="table-action-group">
          <button
  type="button"
  className="table-action-button"
  onClick={async () => {
    const links =
      await getSupplierItemsForCatalogueItem(
        item.catalogue_item_id,
      )

    setViewingSupplierLinks(links)
    setViewingItem(item)
  }}
>
  View
</button>
                            
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() =>
                                handleOpenSuppliers(
                                  item,
                                )
                              }
                            >
                              Suppliers
                            </button>

                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() =>
                                handleEditItem(
                                  item,
                                )
                              }
                            >
                              Edit
                            </button>
                          </div>
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


export default CataloguePage