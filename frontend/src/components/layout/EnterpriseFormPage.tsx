import type {
  ReactNode,
} from 'react'


type EnterpriseFormPageProps = {
  eyebrow: string
  title: string
  description?: string

  backLabel?: string
  onBack: () => void

  children: ReactNode

  footer?: ReactNode
}


function EnterpriseFormPage({
  eyebrow,
  title,
  description,
  backLabel = 'Back',
  onBack,
  children,
  footer,
}: EnterpriseFormPageProps) {
  return (
    <section className="erp-page-form">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="erp-page-form-header">

        <div>
          <p className="erp-page-eyebrow">
            {eyebrow}
          </p>

          <h1>
            {title}
          </h1>

          {description && (
            <p className="erp-page-description">
              {description}
            </p>
          )}
        </div>


        <button
          type="button"
          className="secondary-action-button"
          onClick={onBack}
        >
          ← {backLabel}
        </button>

      </div>


      {/* ======================================================
          PAGE CONTENT
      ====================================================== */}

      <div className="erp-page-form-content">
        {children}
      </div>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      {footer && (
        <div className="erp-page-form-footer">
          {footer}
        </div>
      )}

    </section>
  )
}


export default EnterpriseFormPage