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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" />
        </svg>
      )
    },
    {
      title: '이번 주 권장 액션',
      value: '주 3회 전신 유산소 30분 + 단백질 섭취 강화',
      sub: '수면 8–9시간, 야식·당분 음료 줄이기',
      badge: '가이드',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 10V7h-2v7h5v-2h-3z" />
        </svg>
      )
    }
  ]

  return (
    <section aria-label="맞춤형 AI 성장 분석" className="relative">
      <div className="mb-3">
        <div className="text-[15px] leading-tight">
          <span className="font-semibold text-slate-800">{displayName} 님</span>
          <span className="text-slate-400">을 위한,</span>
        </div>
        <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
          맞춤형 AI 성장 분석
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {insights.map((it, i) => (
          <InsightCard key={i} item={it} />
        ))}
      </div>
    </section>
  )
}

/* PHV (아이콘 팝오버) */
type PHVExample = {
  evaluationDate: string
  monthsLookback: number
  sex: '남' | '여'
  ageMonths: number
  heightNowCm: number
  heightPastCm: number
  meanVelocityCmPerYr: number
  phaseIndex: 0 | 1 | 2 | 3
}

function PHVBarWithInfo({ example }: { example: PHVExample }) {
  const [open, setOpen] = React.useState(false)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const velocity = (example.heightNowCm - example.heightPastCm) / (example.monthsLookback / 12)
  const diff = velocity - example.meanVelocityCmPerYr

  let verdict: { label: string; toneClass: string; chipClass: string }
  if (diff >= 0.8) {
    verdict = {
      label: '평균보다 빠른 편',
      toneClass: 'text-emerald-700',
      chipClass: 'bg-emerald-50 text-emerald-700'
    }
  } else if (diff <= -0.8) {
    verdict = {
      label: '평균보다 느린 편',
      toneClass: 'text-rose-700',
      chipClass: 'bg-rose-50 text-rose-700'
    }
  } else {
    verdict = {
      label: '평균과 비슷',
      toneClass: 'text-slate-700',
      chipClass: 'bg-slate-50 text-slate-700'
    }
  }

  const phases = ['사춘기 이전', 'PHV 직전', 'PHV 진행', 'PHV 이후']

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-medium">
          <span>{example.evaluationDate}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="phv-info-panel"
            onClick={() => setOpen(v => !v)}
            className="p-1 text-slate-600 hover:text-slate-900 focus:outline-none"
            title="PHV 설명 보기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 15a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm1.2-4.7c-.74.42-.95.68-.95 1.2v.25h-1.5v-.35c0-1.04.46-1.7 1.45-2.26.79-.45 1.15-.84 1.15-1.49 0-.87-.68-1.44-1.63-1.44-.96 0-1.64.6-1.73 1.52H7.7c.1-1.84 1.58-3.02 3.62-3.02 2.04 0 3.46 1.13 3.46 2.86 0 1.26-.62 2.02-1.58 2.63z" />
            </svg>
            <span className="sr-only">PHV 설명</span>
          </button>

          {open && (
            <div
              id="phv-info-panel"
              ref={panelRef}
              role="dialog"
              aria-label="PHV 정보"
              className="absolute right-0 z-50 mt-2 w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="max-h-[45vh] overflow-y-auto p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-medium text-slate-500">PHV란?</p>
                    <h3 className="text-[16px] font-bold text-slate-900">Peak Height Velocity</h3>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                    aria-label="닫기"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6.225 4.811 4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z" />
                    </svg>
                  </button>
                </div>

                <p className="text-[13px] leading-relaxed text-slate-700">
                  PHV는 <span className="font-semibold">키가 가장 빠르게 자라는 구간</span>을
                  의미합니다. 일반적으로 사춘기 전후에 나타나며, 구간은 다음과 같이 나눌 수 있어요:
                </p>
                <ul className="mt-2 list-disc pl-5 text-[13px] text-slate-700">
                  <li>사춘기 이전: 성장 속도 완만</li>
                  <li>PHV 직전: 속도가 점차 증가</li>
                  <li>
                    PHV 진행: <span className="font-semibold">성장 속도 최고</span>
                  </li>
                  <li>PHV 이후: 다시 완만해짐</li>
                </ul>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-2 text-[13px]">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <p className="text-[11px] text-slate-500">
                        최근 {example.monthsLookback}개월 성장속도
                      </p>
                      <p className="font-semibold text-slate-900">{velocity.toFixed(1)} cm/년</p>
                    </div>
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <p className="text-[11px] text-slate-500">동연령 평균</p>
                      <p className="font-semibold text-slate-900">
                        {example.meanVelocityCmPerYr.toFixed(1)} cm/년
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <p className="text-[11px] text-slate-500">차이</p>
                      <p
                        className={
                          diff >= 0
                            ? 'font-semibold text-emerald-700'
                            : 'font-semibold text-rose-700'
                        }
                      >
                        {diff >= 0 ? '+' : ''}
                        {diff.toFixed(1)} cm/년
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <p className="text-[11px] text-slate-500">판단</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${verdict.chipClass}`}
                      >
                        {verdict.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 p-2">
                  <p className="text-[12px] font-semibold text-slate-700">해석 팁</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                    최근 속도가 평균보다 빠르면 PHV 구간일 가능성이 높습니다. 최소 6–12개월 추이를
                    함께 확인해 보세요.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
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
              borderRadius: '9999px'
            }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 text-center text-xs">
          {phases.map((p, idx) => (
            <span
              key={p}
              className={
                idx === example.phaseIndex ? 'font-medium text-slate-900' : 'text-slate-300'
              }
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
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
          localStorage.getItem('aicare_name') || localStorage.getItem('username') || ''
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

  const phvDemo: PHVExample = {
    evaluationDate: '2025.08.11',
    monthsLookback: 6,
    sex: '남',
    ageMonths: 147,
    heightNowCm: 151.2,
    heightPastCm: 147.5,
    meanVelocityCmPerYr: 6.1,
    phaseIndex: 2
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

            <PHVBarWithInfo example={phvDemo} />

            <AIAnalysisSection displayName={displayName} />
          </div>
        </main>

        <BottomNav activePage="/" />
      </div>
    </div>
  )
}
