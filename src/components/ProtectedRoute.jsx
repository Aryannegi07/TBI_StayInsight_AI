/**
 * ProtectedRoute
 * Wrap any route element that requires authentication. Redirects
 * unauthenticated users to /login, preserving where they came from.
 *
 * Usage: <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
