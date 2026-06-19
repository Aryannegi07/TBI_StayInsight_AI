import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Reviews from './pages/Reviews'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import UIShowcase from './pages/UIShowcase'

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/reviews"     element={<Reviews />} />
      <Route path="/dashboard"   element={<Dashboard />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/ui-showcase" element={<UIShowcase />} />
    </Routes>
  )
}
