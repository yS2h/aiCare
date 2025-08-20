import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/api/auth/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/api/instance'

type Props = { mode?: 'auth' | 'guest' }

export default function ProtectedRoute({ mode = 'auth' }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // ✅ 모든 Hook은 무조건 같은 순서/갯수로 호출되게 최상단에
  const [childLoading, setChildLoading] = useState(false)
  const [hasChild, setHasChild] = useState<boolean | null>(null)

  // ✅ useEffect도 조건부 return 위로 이동 (내부에서만 가드)
  useEffect(() => {
    let cancelled = false

    // 게스트 라우트거나 사용자 없으면 조회하지 않음
    if (mode === 'guest' || !user) {
      setHasChild(null)
      setChildLoading(false)
      return () => {
        cancelled = true
      }
    }

    const fetchChild = async () => {
      setChildLoading(true)
      try {
        type MeCheck = {
          success: boolean
          message: string
          data: { has_child: boolean; child_id?: string; child_name?: string }
        }
        const res = await api.get<MeCheck>('/me/check') // 임시 엔드포인트
        const exists = !!res?.data?.data?.has_child
        if (!cancelled) setHasChild(exists)
      } catch {
        if (!cancelled) setHasChild(false)
      } finally {
        if (!cancelled) setChildLoading(false)
      }
    }

    fetchChild()
    return () => {
      cancelled = true
    }
  }, [user, mode])

  // ====== 여기부터는 렌더 분기(return) ======
  if (loading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">로딩 중…</span>
      </div>
    )
  }

  if (mode === 'guest') {
    return user ? <Navigate to="/" replace /> : <Outlet />
  }

  if (!user) {
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
