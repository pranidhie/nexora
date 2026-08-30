import type {
  ReactNode,
} from 'react'


export type BreadcrumbItem = {
  label: string

  onClick?: () => void

  icon?: ReactNode
}


type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}


function Breadcrumbs({
  items,
}: BreadcrumbsProps) {
  return (
    <nav
      className="nexora-breadcrumb"
      aria-label="Breadcrumb"
    >
      {items.map(
        (
          item,
          index,
        ) => {
          const isLast =
            index ===
            items.length - 1

          return (
            <span
              key={`${item.label}-${index}`}
              className="nexora-breadcrumb-item"
            >
              {index > 0 && (
                <span
                  className="nexora-breadcrumb-separator"
                  aria-hidden="true"
                >
                  /
                </span>
              )}

              {item.onClick &&
              !isLast ? (
                <button
                  type="button"
                  className="nexora-breadcrumb-link"
                  onClick={
                    item.onClick
                  }
                >
                  {item.icon}

                  {item.label}
                </button>
              ) : (
                <span
                  className={
                    isLast
                      ? 'nexora-breadcrumb-current'
                      : 'nexora-breadcrumb-text'
                  }
                >
                  {item.icon}

                  {item.label}
                </span>
              )}
            </span>
          )
        },
      )}
    </nav>
  )
}


export default Breadcrumbs