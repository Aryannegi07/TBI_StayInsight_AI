/**
 * AuthContext
 * Provides login/logout state across the app.
 */
import { createContext, useContext, useState } from 'react'
import { getUser, getToken, setToken, setUser, removeToken } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getUser())
  const [token, setTokenState] = useState(() => getToken())

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

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
