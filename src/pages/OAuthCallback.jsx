import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { useToast } from '../components/ui/Toast'
import { AuthAPI, setToken } from '../api/api'
import { useAuth } from '../context/AuthContext'

/**
 * OAuthCallback
 * The backend redirects here after a successful Google login, with the
 * JWT in the `token` query param (a full-page OAuth redirect can't write
 * to localStorage directly). This page stores the token, fetches the
 * user's profile, and drops them onto the Dashboard.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = searchParams.get('token')
    if (!token) {
      addToast({ message: 'Google sign-in failed. Please try again.', type: 'error' })
      navigate('/login', { replace: true })
      return
    }

    setToken(token)
    AuthAPI.me()
      .then((res) => {
        login({ token, user: res.data.user })
        addToast({ message: `Welcome, ${res.data.user.name}!`, type: 'success' })
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        addToast({ message: 'Google sign-in failed. Please try again.', type: 'error' })
        navigate('/login', { replace: true })
      })
  }, [searchParams, navigate, login, addToast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Loader size="lg" label="Signing you in…" />
    </div>
  )
}
