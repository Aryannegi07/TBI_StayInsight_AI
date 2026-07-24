import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Loader from '../components/ui/Loader'
import GoogleButton from '../components/GoogleButton'
import { useToast } from '../hooks/useToast'
import { AuthAPI } from '../api/api'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [errors, setErrors]             = useState({})

  const navigate   = useNavigate()
  const { login }  = useAuth()
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Graceful handling of a failed Google OAuth attempt (backend redirects
  // here with ?oauth_error=1 if the user cancels or Google rejects them).
  useEffect(() => {
    if (searchParams.get('oauth_error')) {
      addToast({ message: 'Google sign-in failed. Please try again or use your email and password.', type: 'error' })
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validate() {
    const e = {}
    if (!email.trim())
      e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Enter a valid email address.'
    if (!password)
      e.password = 'Password is required.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      addToast({ message: 'Please fix the validation errors.', type: 'warning' })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await AuthAPI.login(email.trim().toLowerCase(), password)
      login(res.data)
      addToast({ message: `Welcome back, ${res.data.user.name}!`, type: 'success' })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.status === 401
        ? 'Invalid email or password.'
        : err.message || 'Login failed. Please try again.'
      addToast({ message: msg, type: 'error' })
      setErrors({ api: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="card p-8">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <span className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <path d="M2 10.5L7 3.5L12 10.5H2Z" fill="white" fillOpacity="0.9"/>
                  <path d="M5 10.5L7 7L9 10.5H5Z" fill="white" fillOpacity="0.45"/>
                </svg>
              </span>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign in to StayInsight</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your credentials below</p>
              <p className="text-xs text-gray-400 mt-2">
                Demo: <span className="font-mono">admin@stayinsight.ai</span> / <span className="font-mono">password123</span>
              </p>
            </div>

            {errors.api && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700">
                {errors.api}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '', api: '' })) }}
                  placeholder="admin@stayinsight.ai"
                  className={`input ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '', api: '' })) }}
                    placeholder="Enter your password"
                    className={`input pr-10 ${errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M2 7.5S4 3.5 7.5 3.5 13 7.5 13 7.5 11 11.5 7.5 11.5 2 7.5 2 7.5Z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 2L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M2 7.5S4 3.5 7.5 3.5 13 7.5 13 7.5 11 11.5 7.5 11.5 2 7.5 2 7.5Z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader size="sm" />
                    Signing in…
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">or</span>
              <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <GoogleButton />

            <p className="mt-5 text-center text-xs text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-center mt-5 text-xs text-gray-400">
            <Link to="/" className="hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M8 5H2M2 5L4.5 2.5M2 5L4.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to home
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
