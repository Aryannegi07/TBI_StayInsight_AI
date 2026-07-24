// ─── StayInsight AI – Centralised API Utility ────────────────────────────────
// All base URLs and fetch logic lives here.
// Import helpers: { apiGet, apiPost, apiPut, apiDelete } from '../api/api'

import axiosInstance from './axios'

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

// ─── Core fetch wrapper (backed by the shared Axios instance) ───────────────

async function request(method, path, body = null) {
  let res
  try {
    res = await axiosInstance.request({
      method,
      url: path,
      data: body !== null ? body : undefined,
    })
  } catch (err) {
    if (!err.response) {
      throw new Error('Network error – could not reach the server. Is the backend running?', { cause: err })
    }
    const { status, data } = err.response
    const msg =
      data?.message ||
      (status === 404 ? 'Resource not found.' :
       status === 401 ? 'Unauthorised – please log in.' :
       status === 403 ? 'You do not have permission to perform this action.' :
       status === 429 ? 'Too many requests. Please try again later.' :
       status === 500 ? 'Internal server error. Try again later.' :
       `Request failed (${status}).`)
    const wrapped = new Error(msg)
    wrapped.status = status
    wrapped.data = data
    throw wrapped
  }

  // 204 No Content
  if (res.status === 204) return { success: true }
  return res.data
}

export const apiGet    = (path)         => request('GET',    path)
export const apiPost   = (path, body)   => request('POST',   path, body)
export const apiPut    = (path, body)   => request('PUT',    path, body)
export const apiDelete = (path)         => request('DELETE', path)

// ── Endpoint helpers ──────────────────────────────────────────────────────────

export const AuthAPI = {
  login:    (email, password)          => apiPost('/login', { email, password }),
  register: (name, email, password)    => apiPost('/register', { name, email, password }),
  me:       ()                         => apiGet('/me'),
  updateMe: (body)                     => apiPut('/me', body),
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

export const AIApi = {
  // Body: { comment, guestName?, property?, rating? } OR { reviewId }
  analyze: (body) => apiPost('/ai/analyze', body),
}
