import TopBar from '@/components/Topbar'
import { useAuth } from '@/auth/AuthContext'

export default function Home() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">로딩 중…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TopBar title="아이 맞춤 성장 로드맵" variant="light" />
      <button
        onClick={logout}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-grey1 hover:text-white underline"
        aria-label="로그아웃"
      >
        로그아웃
      </button>
    </div>
  )
}
