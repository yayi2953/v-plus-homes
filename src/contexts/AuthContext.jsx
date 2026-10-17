import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const TOKEN_KEY = 'vplus_token'
const USER_KEY = 'vplus_user'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // 校验 token 有效性
  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    const payload = parseJwt(token)
    if (!payload || (payload.exp && Date.now() / 1000 > payload.exp)) {
      logout()
    }
  }, [token])

  const persist = useCallback((t, u) => {
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '登录失败')
      persist(data.token, data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [persist])

  const register = useCallback(async (email, password, name) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '注册失败')
      persist(data.token, data.user)
      return { ok: true, user: data.user }
    } catch (e) {
      return { ok: false, error: e.message }
    } finally {
      setLoading(false)
    }
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...(options.headers || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(url, { ...options, headers })
  }, [token])

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    authFetch
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
