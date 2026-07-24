import { createContext, useEffect, useState } from 'react'
import { getUser, getToken, setToken, setUser, removeToken, AuthAPI } from '../api/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getUser())
  const [token, setTokenState] = useState(() => getToken())
  // True while we verify a stored token against the server on first load.
  // ProtectedRoute waits for this instead of redirecting prematurely on a
  // hard refresh, which previously could flash-redirect to /login before
  // the in-memory auth state had a chance to hydrate from localStorage.
  const [authLoading, setAuthLoading] = useState(() => !!getToken())

  function login(data) {
    setToken(data.token)
    setUser(data.user)
    setTokenState(data.token)
    setUserState(data.user)
  }

  function logout() {
    removeToken()
    setTokenState(null)
    setUserState(null)
  }

  // Merges a partial (or full) fresh user object into both state and
  // localStorage — used after PUT /api/me succeeds so the Navbar avatar,
  // name, and any other consumer of `user` update immediately without
  // needing a full page reload or a second /api/me round-trip.
  function updateUser(freshUser) {
    setUser(freshUser)
    setUserState(freshUser)
  }

  // On mount (i.e. on every full page refresh), verify the stored token is
  // still valid by calling GET /api/me. This is what makes "remain logged
  // in after refresh" reliable — a locally-stored token that has expired or
  // been invalidated server-side is caught immediately, instead of only
  // being caught the next time some other API call happens to 401. It also
  // picks up the sliding-session refreshed token (see authController.me).
  useEffect(() => {
    let cancelled = false
    const storedToken = getToken()

    if (!storedToken) {
      // Deferred so this doesn't set state synchronously inside the effect
      // body (avoids cascading renders) — same pattern used in Dashboard.jsx.
      queueMicrotask(() => { if (!cancelled) setAuthLoading(false) })
      return () => { cancelled = true }
    }

    AuthAPI.me()
      .then((res) => {
        if (cancelled) return
        const freshToken = res.data.token || storedToken
        setToken(freshToken)
        setUser(res.data.user)
        setTokenState(freshToken)
        setUserState(res.data.user)
      })
      .catch(() => {
        if (cancelled) return
        removeToken()
        setTokenState(null)
        setUserState(null)
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!token,
        authLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
