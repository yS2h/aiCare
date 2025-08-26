import TopBar from '@/components/Topbar'
import { useAuth } from '@/api/auth/AuthContext'
import BottomNav from '@/components/BottomNav'
import Graph from '@/pages/GrowthHistory/Graph'
import api from '@/api/instance'
import * as React from 'react'

type Insight = {
  title: string
  value: string
  sub?: string
  badge?: string
  icon?: React.ReactNode
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-medium text-white">
      {children}
    </span>
  )
}

function InsightCard({ item }: { item: Insight }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-xl bg-slate-900/90 text-white">
          {item.icon}
        </div>
        <p className="text-[12px] font-medium text-slate-500">{item.title}</p>
        {item.badge && <Badge>{item.badge}</Badge>}
      </div>
      <p className="text-[15px] font-semibold text-slate-900">{item.value}</p>
      {item.sub && <p className="mt-1 text-[12px] text-slate-500">{item.sub}</p>}
    </div>
  )
}

function AIAnalysisSection({ displayName }: { displayName: string }) {
  const insights: Insight[] = [
    {
      title: '체중·BMI 추세',
      value: '정상 범위 유지',
      sub: '최근 6개월 +2.1kg, BMI 17.8 → 18.4',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" />
        </svg>
      ),
    },
    {
      title: '이번 주 권장 액션',
      value: '주 3회 전신 유산소 30분 + 단백질 섭취 강화',
      sub: '수면 8–9시간, 야식·당분 음료 줄이기',
      badge: '가이드',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 10V7h-2v7h5v-2h-3z" />
        </svg>
      ),
    },
  ]

  return (
    <section aria-label="맞춤형 AI 성장 분석" className="relative">
      <div className="mb-3">
        <div className="text-[15px] leading-tight">
          <span className="font-semibold text-slate-800">{displayName} 님</span>
          <span className="text-slate-400">을 위한,</span>
        </div>
        <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">맞춤형 AI 성장 분석</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {insights.map((it, i) => (
          <InsightCard key={i} item={it} />
        ))}
      </div>
    </section>
  )
}

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
      <div className="flex min-h-screen items-center justify-center bg-main text-white">
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

        <main className="overflow-y-auto px-6 py-4 text-slate-900 pb-28">
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

            <AIAnalysisSection displayName={displayName} />
          </div>
        </main>

        <BottomNav activePage="/" />
      </div>
    </div>
  )
}
