// ─── StayInsight AI – Centralised API Utility ────────────────────────────────
// All base URLs and fetch logic lives here.
// Import helpers: { apiGet, apiPost, apiPut, apiDelete } from '../api/api'

const BASE_URL = '/api'

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('si_token') || null
}

export function setToken(token) {
  localStorage.setItem('si_token', token)
}

export function removeToken() {
  localStorage.removeItem('si_token')
  localStorage.removeItem('si_user')
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('si_user')) || null
  } catch {
    return null
  }
}

export function setUser(user) {
  localStorage.setItem('si_user', JSON.stringify(user))
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const options = { method, headers }
  if (body !== null) options.body = JSON.stringify(body)

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, options)
  } catch {
    throw new Error('Network error – could not reach the server. Is the backend running?')
  }

  // 204 No Content
  if (res.status === 204) return { success: true }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server returned an unexpected response (${res.status}).`)
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      (res.status === 404 ? 'Resource not found.' :
       res.status === 401 ? 'Unauthorised – please log in.' :
       res.status === 500 ? 'Internal server error. Try again later.' :
       `Request failed (${res.status}).`)
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export const apiGet    = (path)         => request('GET',    path)
export const apiPost   = (path, body)   => request('POST',   path, body)
export const apiPut    = (path, body)   => request('PUT',    path, body)
export const apiDelete = (path)         => request('DELETE', path)

// ── Endpoint helpers ──────────────────────────────────────────────────────────

export const AuthAPI = {
  login: (email, password) => apiPost('/login', { email, password }),
}

export const ReviewsAPI = {
  getAll:   ()          => apiGet('/reviews'),
  getById:  (id)        => apiGet(`/reviews/${id}`),
  search:   (q)         => apiGet(`/reviews/search?q=${encodeURIComponent(q)}`),
  create:   (body)      => apiPost('/reviews', body),
  update:   (id, body)  => apiPut(`/reviews/${id}`, body),
  remove:   (id)        => apiDelete(`/reviews/${id}`),
}

export const DashboardAPI = {
  get: () => apiGet('/dashboard'),
}
