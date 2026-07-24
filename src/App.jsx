import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'
import Loader from './components/ui/Loader'

// Code splitting: every route below Home loads on demand, so the initial
// bundle only pays for the landing page. React Router + Suspense show a
// centered loader while a chunk is fetched.
const Reviews = lazy(() => import('./pages/Reviews'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const UIShowcase = lazy(() => import('./pages/UIShowcase'))
const Profile = lazy(() => import('./pages/Profile'))

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader size="lg" label="Loading…" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/reviews"        element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
        <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/ui-showcase"    element={<UIShowcase />} />
      </Routes>
    </Suspense>
  )
}
