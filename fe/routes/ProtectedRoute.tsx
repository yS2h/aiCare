import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import api from '@/api/instance'

type Props = {
  mode?: 'auth' | 'guest' // 기본 'auth' = 로그인 필요
  requireChild?: boolean // true면 /me/check 검사까지
}

export default function ProtectedRoute({ mode = 'auth', requireChild = false }: Props) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [hasChild, setHasChild] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await api.get('/auth/me', { withCredentials: true })
        if (cancelled) return
        setIsAuthed(true)

        if (requireChild) {
          const res = await api.get('/me/check', { withCredentials: true })
          if (cancelled) return
          setHasChild(res?.data?.data?.has_child === true)
        }
      } catch {
        if (!cancelled) setIsAuthed(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [requireChild])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm text-gray-500">확인 중…</span>
      </div>
    )
  }

  // 게스트 전용(로그인 상태면 못 들어옴)
  if (mode === 'guest') {
    return isAuthed ? <Navigate to="/" replace /> : <Outlet />
  }

  // 로그인 필요
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 자녀 등록 필요
  if (requireChild && hasChild === false) {
    return <Navigate to="/information" replace />
  }

  return <Outlet />
}
