import TopBar from '@/components/Topbar'
import { useAuth } from '@/auth/AuthContext'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const { loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">로딩 중…</span>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-x-0 top-0 h-[33vh] bg-main" />

      <div className="relative z-10 grid min-h-screen grid-rows-[auto_1fr_auto]">
        <TopBar title="아이 맞춤 성장 로드맵" variant="dark" />

        <main className="overflow-y-auto px-6 py-4 text-slate-900 ">
          <div className="space-y-6">
            <div className="bg-gray4 rounded-2xl h-70 w-full" />
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={logout}
              className="text-xs text-gray1 hover:text-black underline"
              aria-label="로그아웃"
            >
              로그아웃
            </button>
          </div>
        </main>

        <BottomNav activePage="/" />
      </div>
    </div>
  )
}
