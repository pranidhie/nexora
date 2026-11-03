import type {
  ReactNode,
} from 'react'

import NexoraLogo from '../../NexoraLogo'

import Breadcrumbs from './Breadcrumbs'

import type {
  BreadcrumbItem,
} from './Breadcrumbs'


export type ProcurementSection =
  | 'dashboard'
  | 'ai-assistant'
  | 'suppliers'
  | 'catalogue'
  | 'purchase-requests'
  | 'purchase-orders'
  | 'approvals'
  | 'goods-receipts'
  | 'inventory'


type ProcurementLayoutProps = {
  userName: string

  activeSection:
    ProcurementSection

  onNavigate: (
    section:
      ProcurementSection,
  ) => void

  onLogout: () => void

  children: ReactNode

  breadcrumbs?:
    BreadcrumbItem[]
}


function ProcurementLayout({
  userName,
  activeSection,
  onNavigate,
  onLogout,
  children,
  breadcrumbs,
}: ProcurementLayoutProps) {
  const navigationItems: {
    id: ProcurementSection
    label: string
    icon: string
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'DB',
    },
    {
      id: 'ai-assistant',
      label: 'AI Quality Assistant',
      icon: 'AI',
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: 'SU',
    },
    {
      id: 'catalogue',
      label: 'Catalogue',
      icon: 'CA',
    },
    {
      id: 'purchase-requests',
      label: 'Purchase Requests',
      icon: 'PR',
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: 'PO',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: 'AP',
    },
    {
      id: 'goods-receipts',
      label: 'Goods Receipts',
      icon: 'GR',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'IN',
    },
  ]


  const getPageTitle =
    () => {
      const page =
        navigationItems.find(
          (item) =>
            item.id ===
            activeSection,
        )

      return (
        page?.label ??
        'Dashboard'
      )
    }


  const workspaceName =
    activeSection ===
    'ai-assistant'
      ? 'AI Quality Engineering'
      : 'Procurement'


  const defaultBreadcrumbs:
    BreadcrumbItem[] = [
      {
        label:
          workspaceName,

        onClick:
          () =>
            onNavigate(
              activeSection ===
              'ai-assistant'
                ? 'ai-assistant'
                : 'dashboard',
            ),
      },
      {
        label:
          getPageTitle(),
      },
    ]


  const resolvedBreadcrumbs =
    breadcrumbs &&
    breadcrumbs.length > 0
      ? breadcrumbs
      : defaultBreadcrumbs


  return (
    <div className="procurement-shell">

      <aside className="procurement-sidebar">

        <div className="sidebar-brand">
          <NexoraLogo
            size={42}
            showWordmark
          />

          <div className="sidebar-brand-copy">
            <span>
              Enterprise Quality Engineering
            </span>

            <strong>
              NEXORA Platform
            </strong>
          </div>
        </div>


        <div className="sidebar-section-label">
          Workspace
        </div>


        <nav
          className="sidebar-navigation"
          aria-label="NEXORA workspace navigation"
        >
          {navigationItems.map(
            (item) => (
              <button
                key={
                  item.id
                }
                type="button"
                className={
                  activeSection ===
                  item.id
                    ? 'sidebar-link active'
                    : 'sidebar-link'
                }
                onClick={() =>
                  onNavigate(
                    item.id,
                  )
                }
              >
                <span
                  className="sidebar-link-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            ),
          )}
        </nav>


        <div className="sidebar-system-card">
          <div className="system-status-row">
            <span className="system-status-dot" />

            <div>
              <strong>
                NEXORA API
              </strong>

              <span>
                Connected
              </span>
            </div>
          </div>

          <p>
            ERP and AI quality services operational
          </p>
        </div>


        <div className="sidebar-footer">

          <div className="sidebar-user">

            <span className="sidebar-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </span>

            <div className="sidebar-user-copy">
              <strong>
                {userName}
              </strong>

              <span>
                NEXORA User
              </span>
            </div>
          </div>


          <button
            className="sidebar-logout"
            type="button"
            onClick={
              onLogout
            }
          >
            Sign out
          </button>
        </div>
      </aside>


      <div className="procurement-workspace">

        <header className="workspace-header">

          <div>
            <p className="workspace-breadcrumb">
              {workspaceName} / {getPageTitle()}
            </p>

            <h2>
              {getPageTitle()}
            </h2>
          </div>


          <div className="workspace-header-actions">

            <div className="header-status">
              <span className="header-status-dot" />

              API Online
            </div>


            <div className="header-user">

              <span className="header-user-avatar">
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <span>
                {userName}
              </span>
            </div>
          </div>
        </header>


        <main className="procurement-main">

          <div className="procurement-breadcrumb-row">
            <Breadcrumbs
              items={
                resolvedBreadcrumbs
              }
            />
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}


export default ProcurementLayout