import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type User = {
  id: string
  name?: string
  avatarUrl?: string
} | null

type AuthContextValue = {
  user: User
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include' // 세션 쿠키 포함
      })
      if (!res.ok) {
        setUser(null)
      } else {
        const data = (await res.json()) as User
        setUser(data ?? null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } finally {
      setUser(null)
      window.location.replace('/login')
      console.log('refresh')
    }
  }, [])

  // 앱 최초/홈 리다이렉트 직후 세션 확인
  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 <AuthProvider> 안에서만 사용하세요.')
  return ctx
}
