import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/api/auth/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/api/instance'

type Props = { mode?: 'auth' | 'guest' }

export default function ProtectedRoute({ mode = 'auth' }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isAuthed = !!user?.id

  const [childLoading, setChildLoading] = useState(false)
  const [hasChild, setHasChild] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    if (mode === 'guest' || !isAuthed) {
      setHasChild(null)
      setChildLoading(false)
      return () => {
        cancelled = true
      }
    }

    const fetchChild = async () => {
      setChildLoading(true)
      try {
        const res = await api.get('/me/check')
        const exists = !!res?.data?.data?.has_child
        if (!cancelled) setHasChild(exists)
      } catch (err: any) {
        if (!cancelled) {
          if (err?.response?.status === 401) {
            setHasChild(null)
          } else {
            setHasChild(false)
          }
        }
      } finally {
        if (!cancelled) setChildLoading(false)
      }
    }

    fetchChild()
    return () => {
      cancelled = true
    }
  }, [isAuthed, mode])

  if (loading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">로딩 중…</span>
      </div>
    )
  }

  if (mode === 'guest') {
    return isAuthed ? <Navigate to="/" replace /> : <Outlet />
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (childLoading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">확인 중…</span>
      </div>
    )
  }

  if (hasChild === false && location.pathname !== '/information') {
    return <Navigate to="/information" replace />
  }

  if (hasChild === true && location.pathname === '/information') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
