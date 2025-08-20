import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../instance'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/auth/me')

      if (res.status === 200) {
        const raw = res.data as any
        const normalized =
          raw && typeof raw === 'object' && typeof raw.id === 'string'
            ? { id: raw.id, name: raw.name, avatarUrl: raw.avatarUrl }
            : null
        setUser(normalized)
      } else if (res.status === 204) {
        setUser(null)
      } else {
        setUser(null)
      }
    } catch (err: unknown) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

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
