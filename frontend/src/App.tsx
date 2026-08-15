import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import NexoraLogo from './NexoraLogo'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
      )

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password.')
        }

        throw new Error('Unable to sign in. Please try again.')
      }

      const data: LoginResponse = await response.json()

      sessionStorage.setItem(
        'nexora_access_token',
        data.access_token,
      )

      setUserName(
        `${data.user.first_name} ${data.user.last_name}`,
      )
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : 'Unable to sign in.'

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (userName) {
    return (
      <main className="dashboard">
        <section className="welcome-card">
          <NexoraLogo size={64} />
          <p className="eyebrow">NEXORA PROCUREMENT</p>
          <h1>Welcome, {userName}</h1>
          <p>
            Authentication was successful. Your protected
            procurement dashboard is ready for the next milestone.
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('nexora_access_token')
              setUserName('')
              setPassword('')
            }}
          >
            Sign out
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="brand-content">
          <NexoraLogo size={64} showWordmark />
         
          
          <h2>Procurement intelligence, engineered with confidence.</h2>
          <p className="brand-description">
            A modern enterprise procurement and Quality Engineering
            platform designed for secure, intelligent workflows.
          </p>

          <div className="feature-list">
            <span>Secure access</span>
            <span>Intelligent workflows</span>
            <span>Quality engineering</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <form className="login-card" onSubmit={handleLogin}>
          <p className="eyebrow">SECURE PORTAL</p>
          <h2>Welcome back</h2>
          <p className="form-intro">
            Sign in to access the NEXORA procurement workspace.
          </p>

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          <button
            className="submit-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="security-note">
            Secure authentication protects your NEXORA account.
          </p>
        </form>
      </section>
    </main>
  )
}

export default App