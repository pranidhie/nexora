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

import AIQualityAssistantPage from './pages/ai/AIQualityAssistantPage'
import ApprovalsPage from './pages/procurement/ApprovalsPage'
import CataloguePage from './pages/procurement/CataloguePage'
import GoodsReceiptsPage from './pages/procurement/GoodsReceiptsPage'
import InventoryPage from './pages/procurement/InventoryPage'
import ProcurementDashboard from './pages/procurement/ProcurementDashboard'
import PurchaseOrdersPage from './pages/procurement/PurchaseOrdersPage'
import PurchaseRequestsPage from './pages/procurement/PurchaseRequestsPage'
import SuppliersPage from './pages/procurement/SuppliersPage'


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

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)

  const [
    activeSection,
    setActiveSection,
  ] = useState<ProcurementSection>(
    'dashboard',
  )


  // Restore authenticated user from session storage.

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

      return (
        `${user.first_name} ${user.last_name}`
      )
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


  // Authenticate the user.

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

        if (!response.ok) {
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
          loginError instanceof
          Error
            ? loginError.message
            : 'Unable to sign in.'

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }


  // End the authenticated session.

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


  // Render the selected NEXORA module.

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

        case 'ai-assistant':
          return (
            <AIQualityAssistantPage />
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


  // Authenticated NEXORA application.

  if (userName) {
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


  // Login page.

  return (
    <main className="login-page">

      <section className="brand-panel">
        <div className="brand-content">

          <NexoraLogo
            size={64}
            showWordmark
          />


          <h2>
            Procurement intelligence,
            engineered with confidence.
          </h2>


          <p className="brand-description">
            A modern enterprise procurement and Quality
            Engineering platform designed for secure,
            intelligent workflows.
          </p>


          <div
            className="ai-visual"
            aria-hidden="true"
          >
            <div className="ai-grid" />

            <div className="ai-scan-line" />


            <div className="ai-orbit orbit-one">
              <span className="orbit-dot orbit-dot-one" />
            </div>


            <div className="ai-orbit orbit-two">
              <span className="orbit-dot orbit-dot-two" />
            </div>


            <div className="ai-orbit orbit-three">
              <span className="orbit-dot orbit-dot-three" />
            </div>


            <div className="ai-core">
              <div className="ai-core-wave wave-one" />

              <div className="ai-core-wave wave-two" />

              <div className="ai-core-inner">
                <span className="ai-core-label">
                  NEXORA
                </span>

                <strong>
                  AI
                </strong>

                <span className="ai-core-status">
                  ANALYSING
                </span>
              </div>
            </div>


            <div className="ai-process-node node-supplier">
              <span>
                SUP
              </span>

              <strong>
                Supplier
              </strong>
            </div>


            <div className="ai-process-node node-request">
              <span>
                PR
              </span>

              <strong>
                Request
              </strong>
            </div>


            <div className="ai-process-node node-order">
              <span>
                PO
              </span>

              <strong>
                Order
              </strong>
            </div>


            <div className="ai-process-node node-approval">
              <span>
                ✓
              </span>

              <strong>
                Approval
              </strong>
            </div>


            <div className="ai-process-node node-receipt">
              <span>
                GR
              </span>

              <strong>
                Receipt
              </strong>
            </div>


            <div className="ai-process-node node-inventory">
              <span>
                INV
              </span>

              <strong>
                Inventory
              </strong>
            </div>


            <span className="ai-particle particle-one" />
            <span className="ai-particle particle-two" />
            <span className="ai-particle particle-three" />
            <span className="ai-particle particle-four" />
            <span className="ai-particle particle-five" />
            <span className="ai-particle particle-six" />


            <div className="ai-data-stream stream-one" />
            <div className="ai-data-stream stream-two" />
            <div className="ai-data-stream stream-three" />
          </div>


          <div className="feature-list">
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


      <section className="form-panel">
        <form
          className="login-card"
          onSubmit={
            handleLogin
          }
        >
          <p className="eyebrow">
            SECURE PORTAL
          </p>


          <h2>
            Welcome back
          </h2>


          <p className="form-intro">
            Sign in to access the NEXORA ERP and
            AI Quality Engineering workspace.
          </p>


          <label htmlFor="email">
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


          <label htmlFor="password">
            Password
          </label>


          <div className="password-field">
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


          {error && (
            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>
          )}


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


          <p className="security-note">
            Secure authentication protects your
            NEXORA account.
          </p>

        </form>
      </section>

    </main>
  )
}


export default App