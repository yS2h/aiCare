import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

type Props = { mode?: 'auth' | 'guest' }

export default function ProtectedRoute({ mode = 'auth' }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

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

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}
