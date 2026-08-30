import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import './App.css'

import NexoraLogo from './NexoraLogo'

import {
  apiClient,
} from './api/client'

import ProcurementLayout from './components/layout/ProcurementLayout'

import type {
  ProcurementSection,
} from './components/layout/ProcurementLayout'

import ProcurementDashboard from './pages/procurement/ProcurementDashboard'

import SuppliersPage from './pages/procurement/SuppliersPage'

import CataloguePage from './pages/procurement/CataloguePage'

import PurchaseRequestsPage from './pages/procurement/PurchaseRequestsPage'

import PurchaseOrdersPage from './pages/procurement/PurchaseOrdersPage'

import ApprovalsPage from './pages/procurement/ApprovalsPage'

import GoodsReceiptsPage from './pages/procurement/GoodsReceiptsPage'

import InventoryPage from './pages/procurement/InventoryPage'


// ============================================================
// LOGIN RESPONSE
// ============================================================

type LoginResponse = {
  access_token: string

  token_type: string

  user: {
    user_id: number

    first_name: string

    last_name: string

    email: string

    status: string
  }
}


// ============================================================
// APP
// ============================================================

function App() {
  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  // ============================================================
  // RESTORE AUTHENTICATED USER FROM SESSION STORAGE
  // ============================================================

  const [
    userName,
    setUserName,
  ] = useState(() => {
    const storedUser =
      sessionStorage.getItem(
        'nexora_user',
      )

    if (!storedUser) {
      return ''
    }

    try {
      const user = JSON.parse(
        storedUser,
      ) as {
        first_name?: string
        last_name?: string
      }

      if (
        !user.first_name ||
        !user.last_name
      ) {
        sessionStorage.removeItem(
          'nexora_user',
        )

        sessionStorage.removeItem(
          'nexora_access_token',
        )

        return ''
      }

      return `${user.first_name} ${user.last_name}`
    } catch {
      sessionStorage.removeItem(
        'nexora_user',
      )

      sessionStorage.removeItem(
        'nexora_access_token',
      )

      return ''
    }
  })

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<ProcurementSection>(
      'dashboard',
    )


  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin =
    async (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      setError('')

      if (
        !email.trim() ||
        !password
      ) {
        setError(
          'Email and password are required.',
        )

        return
      }

      try {
        setIsLoading(true)

        const response =
          await apiClient(
            '/api/v1/auth/login',
            {
              method:
                'POST',

              body:
                JSON.stringify({
                  email:
                    email
                      .trim()
                      .toLowerCase(),

                  password,
                }),
            },
          )

        if (
          !response.ok
        ) {
          if (
            response.status ===
            401
          ) {
            throw new Error(
              'Invalid email or password.',
            )
          }

          throw new Error(
            'Unable to sign in. Please try again.',
          )
        }

        const data:
          LoginResponse =
            await response.json()

        sessionStorage.setItem(
          'nexora_access_token',
          data.access_token,
        )

        sessionStorage.setItem(
          'nexora_user',
          JSON.stringify(
            data.user,
          ),
        )

        setUserName(
          `${data.user.first_name} ${data.user.last_name}`,
        )

        setActiveSection(
          'dashboard',
        )
      } catch (
        loginError
      ) {
        const message =
          loginError instanceof Error
            ? loginError.message
            : 'Unable to sign in.'

        setError(
          message,
        )
      } finally {
        setIsLoading(
          false,
        )
      }
    }


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout =
    () => {
      sessionStorage.removeItem(
        'nexora_access_token',
      )

      sessionStorage.removeItem(
        'nexora_user',
      )

      setUserName('')

      setEmail('')

      setPassword('')

      setError('')

      setActiveSection(
        'dashboard',
      )
    }


  // ============================================================
  // AUTHENTICATED PROCUREMENT PAGES
  // ============================================================

  const renderAuthenticatedContent =
    () => {
      switch (
        activeSection
      ) {
        case 'dashboard':
          return (
            <ProcurementDashboard
              onNavigate={
                setActiveSection
              }
            />
          )

        case 'suppliers':
          return (
            <SuppliersPage />
          )

        case 'catalogue':
          return (
            <CataloguePage />
          )

        case 'purchase-requests':
          return (
            <PurchaseRequestsPage />
          )

        case 'purchase-orders':
          return (
            <PurchaseOrdersPage />
          )

        case 'approvals':
          return (
            <ApprovalsPage />
          )

        case 'goods-receipts':
          return (
            <GoodsReceiptsPage />
          )

        case 'inventory':
          return (
            <InventoryPage />
          )

        default:
          return (
            <ProcurementDashboard
              onNavigate={
                setActiveSection
              }
            />
          )
      }
    }


  // ============================================================
  // AUTHENTICATED APPLICATION
  // ============================================================

  if (
    userName
  ) {
    return (
      <ProcurementLayout
        userName={
          userName
        }

        activeSection={
          activeSection
        }

        onNavigate={
          setActiveSection
        }

        onLogout={
          handleLogout
        }
      >
        {
          renderAuthenticatedContent()
        }
      </ProcurementLayout>
    )
  }


  // ============================================================
  // LOGIN PAGE
  // ============================================================

  return (
    <main
      className="login-page"
    >

      {/* ======================================================
          LEFT BRAND / AI PANEL
      ====================================================== */}

      <section
        className="brand-panel"
      >
        <div
          className="brand-content"
        >

          {/* ==================================================
              LOGO
          ================================================== */}

          <NexoraLogo
            size={64}
            showWordmark
          />


          {/* ==================================================
              HERO CONTENT
          ================================================== */}

          <h2>
            Procurement intelligence,
            engineered with confidence.
          </h2>


          <p
            className="brand-description"
          >
            A modern enterprise
            procurement and Quality
            Engineering platform
            designed for secure,
            intelligent workflows.
          </p>


          {/* ==================================================
              AI VIDEO-LIKE ANIMATION
          ================================================== */}

          <div
            className="ai-visual"
            aria-hidden="true"
          >

            {/* Moving digital background */}

            <div
              className="ai-grid"
            />


            {/* Scanner */}

            <div
              className="ai-scan-line"
            />


            {/* =================================================
                ORBIT 1
            ================================================= */}

            <div
              className="ai-orbit orbit-one"
            >
              <span
                className="orbit-dot orbit-dot-one"
              />
            </div>


            {/* =================================================
                ORBIT 2
            ================================================= */}

            <div
              className="ai-orbit orbit-two"
            >
              <span
                className="orbit-dot orbit-dot-two"
              />
            </div>


            {/* =================================================
                ORBIT 3
            ================================================= */}

            <div
              className="ai-orbit orbit-three"
            >
              <span
                className="orbit-dot orbit-dot-three"
              />
            </div>


            {/* =================================================
                AI CORE
            ================================================= */}

            <div
              className="ai-core"
            >
              <div
                className="ai-core-wave wave-one"
              />

              <div
                className="ai-core-wave wave-two"
              />


              <div
                className="ai-core-inner"
              >
                <span
                  className="ai-core-label"
                >
                  NEXORA
                </span>

                <strong>
                  AI
                </strong>

                <span
                  className="ai-core-status"
                >
                  ANALYSING
                </span>
              </div>
            </div>


            {/* =================================================
                PROCUREMENT PROCESS NODES
            ================================================= */}

            <div
              className="ai-process-node node-supplier"
            >
              <span>
                SUP
              </span>

              <strong>
                Supplier
              </strong>
            </div>


            <div
              className="ai-process-node node-request"
            >
              <span>
                PR
              </span>

              <strong>
                Request
              </strong>
            </div>


            <div
              className="ai-process-node node-order"
            >
              <span>
                PO
              </span>

              <strong>
                Order
              </strong>
            </div>


            <div
              className="ai-process-node node-approval"
            >
              <span>
                ✓
              </span>

              <strong>
                Approval
              </strong>
            </div>


            <div
              className="ai-process-node node-receipt"
            >
              <span>
                GR
              </span>

              <strong>
                Receipt
              </strong>
            </div>


            <div
              className="ai-process-node node-inventory"
            >
              <span>
                INV
              </span>

              <strong>
                Inventory
              </strong>
            </div>


            {/* =================================================
                MOVING DATA PARTICLES
            ================================================= */}

            <span
              className="ai-particle particle-one"
            />

            <span
              className="ai-particle particle-two"
            />

            <span
              className="ai-particle particle-three"
            />

            <span
              className="ai-particle particle-four"
            />

            <span
              className="ai-particle particle-five"
            />

            <span
              className="ai-particle particle-six"
            />


            {/* =================================================
                DATA CONNECTION STREAMS
            ================================================= */}

            <div
              className="ai-data-stream stream-one"
            />

            <div
              className="ai-data-stream stream-two"
            />

            <div
              className="ai-data-stream stream-three"
            />

          </div>


          {/* ==================================================
              FEATURE TAGS
          ================================================== */}

          <div
            className="feature-list"
          >
            <span>
              Secure access
            </span>

            <span>
              Intelligent workflows
            </span>

            <span>
              Quality engineering
            </span>
          </div>

        </div>
      </section>


      {/* ======================================================
          RIGHT LOGIN PANEL
      ====================================================== */}

      <section
        className="form-panel"
      >
        <form
          className="login-card"
          onSubmit={
            handleLogin
          }
        >

          {/* ==================================================
              LOGIN HEADER
          ================================================== */}

          <p
            className="eyebrow"
          >
            SECURE PORTAL
          </p>


          <h2>
            Welcome back
          </h2>


          <p
            className="form-intro"
          >
            Sign in to access the
            NEXORA procurement
            workspace.
          </p>


          {/* ==================================================
              EMAIL
          ================================================== */}

          <label
            htmlFor="email"
          >
            Email address
          </label>


          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"

            value={
              email
            }

            onChange={
              (
                event,
              ) =>
                setEmail(
                  event.target.value,
                )
            }
          />


          {/* ==================================================
              PASSWORD
          ================================================== */}

          <label
            htmlFor="password"
          >
            Password
          </label>


          <div
            className="password-field"
          >
            <input
              id="password"

              type={
                showPassword
                  ? 'text'
                  : 'password'
              }

              autoComplete="current-password"

              placeholder="Enter your password"

              value={
                password
              }

              onChange={
                (
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
              }
            />


            <button
              className="password-toggle"

              type="button"

              onClick={
                () =>
                  setShowPassword(
                    (
                      current,
                    ) =>
                      !current,
                  )
              }
            >
              {
                showPassword
                  ? 'Hide'
                  : 'Show'
              }
            </button>
          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <p
              className="error-message"

              role="alert"
            >
              {error}
            </p>
          )}


          {/* ==================================================
              SIGN IN
          ================================================== */}

          <button
            className="submit-button"

            type="submit"

            disabled={
              isLoading
            }
          >
            {
              isLoading
                ? 'Signing in…'
                : 'Sign in'
            }
          </button>


          {/* ==================================================
              SECURITY NOTE
          ================================================== */}

          <p
            className="security-note"
          >
            Secure authentication
            protects your NEXORA
            account.
          </p>

        </form>
      </section>

    </main>
  )
}


export default App