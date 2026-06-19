import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Login() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [errors, setErrors]         = useState({})
  const [submitted, setSubmitted]   = useState(false)

  function validate() {
    const e = {}
    if (!email.trim())                              e.email    = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.'
    if (!password)                                  e.password = 'Password is required.'
    else if (password.length < 8)                   e.password = 'Password must be at least 8 characters.'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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

            {submitted ? (
              <div className="text-center py-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9L7.5 13L14.5 5.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-1">Welcome back!</h2>
                <p className="text-sm text-gray-500 mb-5">Signed in as {email}</p>
                <Link to="/dashboard" className="btn-primary w-full justify-center">
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-lg font-semibold text-gray-900">Sign in to StayInsight</h1>
                  <p className="text-sm text-gray-500 mt-1">Enter your credentials below</p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                      placeholder="you@hotel.com"
                      className={`input ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                        placeholder="Min. 8 characters"
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

                  {/* Forgot */}
                  <div className="flex justify-end">
                    <Link to="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" strokeDasharray="8 8" strokeLinecap="round"/>
                        </svg>
                        Signing in…
                      </>
                    ) : 'Sign in'}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-500">
                  Don't have an account?{' '}
                  <Link to="#" className="text-brand-600 hover:text-brand-700 font-medium transition-colors">
                    Request access
                  </Link>
                </p>
              </>
            )}
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
