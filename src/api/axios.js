// ─── StayInsight AI – Axios Instance ──────────────────────────────────────────
// Central Axios instance used by every API call in the app.
//  • Automatically attaches the JWT (if present) to every request.
//  • Automatically logs the user out and redirects to /login on 401.

import axios from 'axios'
import { getToken, removeToken } from './api'

// In dev, Vite's proxy (vite.config.js) forwards '/api' to the local
// backend, so no env var is needed. In production the frontend and
// backend are deployed separately (e.g. Vercel + Render), so
// VITE_API_URL must point at the deployed backend's '/api' base —
// see .env.example.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ───────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: auto-logout on 401 ─────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
