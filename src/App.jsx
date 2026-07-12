import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Reviews from './pages/Reviews'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import OAuthCallback from './pages/OAuthCallback'
import UIShowcase from './pages/UIShowcase'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<Home />} />
      <Route path="/reviews"        element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/login"          element={<Login />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/ui-showcase"    element={<UIShowcase />} />
    </Routes>
  )
}
