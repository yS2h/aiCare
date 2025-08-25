import TopBar from '@/components/Topbar'
import { useAuth } from '@/api/auth/AuthContext'
import BottomNav from '@/components/BottomNav'
import Graph from '@/pages/GrowthHistory/Graph'
import api from '@/api/instance'
import * as React from 'react'

export default function Home() {
  const { loading } = useAuth()

  const [displayName, setDisplayName] = React.useState<string>('사용자')

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await api.get('/auth/me')
        const name =
          res?.data?.name ||
          res?.data?.user?.name ||
          res?.data?.data?.name ||
          res?.data?.profile?.nickname
        if (alive && typeof name === 'string' && name.trim()) {
          setDisplayName(name.trim())
        }
      } catch {
        const fromLocal =
          localStorage.getItem('aicare_name') ||
          localStorage.getItem('username') ||
          ''
        if (alive && fromLocal.trim()) setDisplayName(fromLocal.trim())
      }
    })()
    return () => {
      alive = false
    }
  }, [])

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

        <main className="overflow-y-auto px-6 py-4 text-slate-900">
          <div className="space-y-6">

            <Graph title="최근 성장 추이" compact titleClassName="text-white" />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[15px] font-medium">
                <span>2025.08.11</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div>
                <div className="relative mx-1 h-3 rounded-full bg-slate-200">
                  <div
                    className="absolute rounded-full bg-slate-900"
                    style={{
                      top: '55%',                 
                      left: '62.5%',              
                      transform: 'translate(-50%, -50%)',
                      height: '10px',
                      width: '22%',
                      borderRadius: '9999px',
                    }}
                  />
                </div>

                <div className="mt-2 grid grid-cols-4 text-center text-xs">
                  <span className="text-slate-300">사춘기 이전</span>
                  <span className="text-slate-300">PHV 직전</span>
                  <span className="font-medium text-slate-900">PHV 진행</span>
                  <span className="text-slate-300">PHV 이후</span>
                </div>
              </div>
            </div>

            <section className="space-y-1">
              <div className="text-[15px] leading-tight">
                <span className="font-semibold text-slate-800">{displayName} 님</span>
                <span className="text-slate-400">을 위한,</span>
              </div>
              <div className="text-[15px] font-bold tracking-tight">
                맞춤형 AI 성장 분석
              </div>
            </section>


          </div>
        </main>

        <BottomNav activePage="/" />
      </div>
    </div>
  )
}
