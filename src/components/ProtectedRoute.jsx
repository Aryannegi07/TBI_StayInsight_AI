/**
 * ProtectedRoute
 * Wrap any route element that requires authentication. Redirects
 * unauthenticated users to /login, preserving where they came from.
 * Shows a loader while the stored token is still being verified against
 * the server (see AuthContext) so refreshing a protected page never
 * flashes a redirect before the session has finished hydrating.
 *
 * Usage: <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Loader from './ui/Loader'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, authLoading } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader size="lg" label="Checking your session…" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
