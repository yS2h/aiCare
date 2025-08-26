import React, { useMemo, useRef } from 'react'
import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import GrowthGraph from './GrowthHistory/Graph'

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

type UserInfo = {
  name?: string
  sex?: '남' | '여' | string
  age?: number
  birthDate?: string
}

export type GrowthPoint = {
  date: string
  height: number
  weight: number
}

type Analysis = {
  boneAgeYears?: number
  boneAgeStd?: number
  phvNote?: string
  postureType?: string
  scoliosisRisk?: string
  scoliosisMainCobb?: number
  notes?: string
}

const pickNum = (o: any, ks: string[]) =>
  ks.find(k => typeof o?.[k] === 'number')
    ? (o as any)[ks.find(k => typeof o?.[k] === 'number') as string]
    : undefined

const pickStr = (o: any, ks: string[]) =>
  ks.find(k => typeof o?.[k] === 'string')
    ? (o as any)[ks.find(k => typeof o?.[k] === 'string') as string]
    : undefined

const calcBMI = (wKg: number, hCm: number) => {
  const h = hCm / 100
  return +(wKg / (h * h)).toFixed(1)
}

const calcAgeFromBirth = (birth?: string) => {
  if (!birth) return undefined
  const b = new Date(birth)
  if (Number.isNaN(+b)) return undefined
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

function loadInfoFromStorage(): Partial<UserInfo> {
  const candidates = ['aicare_information', 'information', 'childInfo', 'profile']
  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const j = JSON.parse(raw)
      const name = pickStr(j, ['name', 'childName', 'username'])
      const sex = pickStr(j, ['sex', 'gender'])
      const age = pickNum(j, ['age'])
      const birthDate = pickStr(j, ['birthDate', 'birth', 'birthday'])
      return { name, sex, age, birthDate }
    } catch {}
  }
  return {}
}

function loadAnalysisFromStorage(): Analysis {
  try {
    const raw =
      localStorage.getItem('aicare_analysis') ||
      localStorage.getItem('bone_posture_analysis')
    if (!raw) return {}
    const j = JSON.parse(raw)
    return {
      boneAgeYears: pickNum(j, ['boneAgeYears', 'bone_age_years']),
      boneAgeStd: pickNum(j, ['boneAgeStd', 'bone_age_std']),
      phvNote: pickStr(j, ['phvNote', 'phv_note', 'phv']),
      postureType: pickStr(j, ['postureType', 'posture']),
      scoliosisRisk: pickStr(j, ['scoliosisRisk', 'scoliosis', 'risk']),
      scoliosisMainCobb: pickNum(j, ['scoliosisMainCobb', 'cobb_main']),
      notes: pickStr(j, ['notes', 'summary'])
    }
  } catch {
    return {}
  }
}

function useUserInfo(): { data: UserInfo | null; loading: boolean } {
  const [data, setData] = React.useState<UserInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, { credentials: 'include' })
        const j: any = res.ok ? await res.json() : null
        const me = j ? (j.data ?? j) : null

        const fromMe: Partial<UserInfo> = me
          ? {
              name: pickStr(me, ['name', 'username', 'childName']),
              sex: pickStr(me, ['sex', 'gender']),
              age: pickNum(me, ['age']),
              birthDate: pickStr(me, ['birthDate', 'birth', 'birthday'])
            }
          : {}

        const fromStorage = loadInfoFromStorage()

        const merged: UserInfo = {
          name: fromStorage.name ?? fromMe.name,
          sex: fromStorage.sex ?? fromMe.sex,
          age:
            fromStorage.age ??
            fromMe.age ??
            calcAgeFromBirth(fromStorage.birthDate ?? fromMe.birthDate),
          birthDate: fromStorage.birthDate ?? fromMe.birthDate
        }

        if (mounted) setData(merged)
      } catch {
        if (mounted) setData(loadInfoFromStorage() as UserInfo)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading }
}

function useGrowth(): { data: GrowthPoint[]; loading: boolean } {
  const [data, setData] = React.useState<GrowthPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/growth`, { credentials: 'include' })
        const j: any = await res.json().catch(() => null)
        const arr: any[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []

        const norm: GrowthPoint[] = (arr || [])
          .map(r => {
            const date = (
              pickStr(r, ['recorded_at', 'date', 'measuredAt', 'created_at', 'createdAt']) ??
              new Date().toISOString()
            ).slice(0, 10)
            const height = pickNum(r, ['height_cm', 'height', 'heightCm', 'cm'])
            const weight = pickNum(r, ['weight_kg', 'weight', 'weightKg', 'kg'])
            if (typeof height !== 'number' || typeof weight !== 'number') return null as any
            return { date, height, weight }
          })
          .filter(Boolean) as GrowthPoint[]

        norm.sort((a, b) => (a.date > b.date ? 1 : -1))
        if (mounted) setData(norm)
      } catch {
        if (mounted) setData([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading }
}

export default function Guide() {
  const HEADER_H = 64
  const FOOTER_H = 84

  const { data: user } = useUserInfo()
  const { data: growth } = useGrowth()

  const latest = growth.length ? growth[growth.length - 1] : null
  const bmi = latest ? calcBMI(latest.weight, latest.height) : undefined

  const analysis = useMemo(() => loadAnalysisFromStorage(), [])
  const sheetRef = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    const el = sheetRef.current
    if (!el) return

    const filename = `aicare-report-${user?.name ?? 'user'}-${latest?.date ?? ''}.pdf`

    await wait(120)
    el.classList.add('print-fill')

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight
      })

      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const s = Math.min(pageW / canvas.width, pageH / canvas.height)
      const w = canvas.width * s
      const h = canvas.height * s
      const x = (pageW - w) / 2
      const y = (pageH - h) / 2

      pdf.addImage(img, 'PNG', x, y, w, h, undefined, 'FAST')
      pdf.save(filename)
    } catch (e) {
      console.warn('[PDF] 캡처 실패 → 브라우저 인쇄 폴백:', e)

      const style = document.createElement('style')
      style.textContent = `
        @page { size: A4; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden !important; }
          #report-sheet, #report-sheet * { visibility: visible !important; }
          #report-sheet {
            position: fixed; inset: 0;
            width: 210mm; height: 297mm;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
          }
        }
      `
      document.head.appendChild(style)
      const prev = document.title
      document.title = filename
      window.print()
      setTimeout(() => {
        document.title = prev
        style.remove()
      }, 800)
    } finally {
      el.classList.remove('print-fill')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-x-hidden">
      <TopBar title="종합 성장 가이드" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden scroll-smooth flex justify-center px-6 pt-2 pb-20"
      >
        <div className="w-full max-w-[820px]">
          <ReportSheet
            ref={sheetRef}
            user={user}
            growth={growth}
            bmi={bmi}
            analysis={analysis}
          />
          <div className="mt-2">
            <Button
              label="PDF 저장하기"
              onClick={downloadPDF}
              style={{ maxWidth: 'none', borderRadius: 12 }}
            />
          </div>
        </div>
      </main>
      <BottomNav activePage="/guide" />
    </div>
  )
}

const ReportSheet = React.forwardRef<
  HTMLDivElement,
  {
    user: UserInfo | null
    growth: GrowthPoint[]
    bmi?: number
    analysis: Analysis
  }
>(({ user, growth, bmi, analysis }, ref) => {
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123
  const PADDING = 28

  const latest = growth.length ? growth[growth.length - 1] : null
  const dateText = useMemo(() => (latest?.date ? latest.date.replace(/-/g, '.') : '-'), [latest])

  const graphRecords = useMemo(
    () =>
      growth.length
        ? growth.map(g => ({
            id: g.date,
            child_id: '',
            recorded_at: g.date,
            height_cm: g.height,
            weight_kg: g.weight,
            bmi: 0,
            notes: null,
            created_at: g.date,
            updated_at: g.date
          }))
        : undefined,
    [growth]
  )

  const boneAgeText =
    analysis.boneAgeYears !== undefined
      ? `${analysis.boneAgeYears.toFixed(1)}세` +
        (analysis.boneAgeStd ? ` (±${analysis.boneAgeStd.toFixed(1)}년)` : '')
      : user?.age
      ? `${(user.age - 0.2).toFixed(1)}세 (추정)`
      : '-'

  const phvNote = analysis.phvNote ?? 'PHV 시점 약 1년 이내 예상'
  const postureType = analysis.postureType ?? '정상 체형'
  const scoliosisRisk = analysis.scoliosisRisk ?? '정상'
  const cobbText =
    analysis.scoliosisMainCobb !== undefined ? `${analysis.scoliosisMainCobb.toFixed(1)}°` : '—'

  return (
    <div
      ref={ref}
      id="report-sheet"
      className="bg-white rounded-xl border border-gray-200 shadow-sm"
      style={{
        width: A4_WIDTH,
        height: A4_HEIGHT,
        padding: PADDING,
        boxSizing: 'border-box',
        margin: '0 auto'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-gray-900">
            aiCare <span className="text-gray-500 text-sm align-middle">성장 리포트</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1 text-[13px] text-gray-700">
            <div>
              <span className="text-gray-500">이름</span> : {user?.name ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">성별</span> : {user?.sex ?? '-'}
            </div>
            <div>
              <span className="text-gray-500">나이</span> : {user?.age ?? '-'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[12px] text-gray-600 whitespace-nowrap">최근 측정일</div>
          <div className="text-[15px] font-semibold text-gray-900 whitespace-nowrap leading-tight">
            {dateText}
          </div>
        </div>
      </div>

      <div className="my-4 h-px bg-gray-200" />

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-3 text-white">
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <p className="text-[12px] opacity-90">
          최근 기록과 표준 성장도표를 바탕으로 <span className="font-semibold">핵심 지표</span>와{' '}
          <span className="font-semibold">예측 인사이트</span>를 요약합니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">데이터 기반</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">개인화</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">예측 & 가이드</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <section className="space-y-3">
          <Card title="핵심 지표">
            <div className="grid grid-cols-3 gap-2">
              <KPI label="키" value={latest ? `${latest.height.toFixed(1)} cm` : '-'} />
              <KPI label="체중" value={latest ? `${latest.weight.toFixed(1)} kg` : '-'} />
              <KPI label="BMI" value={bmi !== undefined ? String(bmi) : '-'} />
            </div>
          </Card>

          <Card title="골격 성숙도 (뼈나이)">
            <div className="text-[13px] font-semibold text-gray-900">{boneAgeText}</div>
            <div className="mt-1 text-[12px] text-gray-600">
              {phvNote}
              {analysis.notes ? ` · ${analysis.notes}` : ''}
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <Card title="이번 주 권장 액션">
            <div className="text-[13px] font-semibold text-gray-900">
              주 3회 전신 유산소 30분 + 단백질 섭취 강화
            </div>
            <div className="mt-1 text-[12px] text-gray-600">수면 8–9시간, 야식·당분 음료 줄이기</div>
          </Card>

          <Card title="체형 분석">
            <div className="text-[13px] font-semibold text-gray-900">{postureType}</div>
            <div className="mt-1 text-[12px] text-gray-600">
              척추측만 위험도: {scoliosisRisk}
              {' · '}주요 Cobb 각도: {cobbText}
            </div>
          </Card>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 p-2">
          <h3 className="mb-2 text-[13px] font-semibold text-gray-900">키 추이</h3>
          <div style={{ height: 200 }}>
            <GrowthGraph
              data={graphRecords as any}
              compact
              fixedMetric="height"
              title={undefined}
              hideToggle
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-2">
          <h3 className="mb-2 text-[13px] font-semibold text-gray-900">몸무게 추이</h3>
          <div style={{ height: 200 }}>
            <GrowthGraph
              data={graphRecords as any}
              compact
              fixedMetric="weight"
              title={undefined}
              hideToggle
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
        본 리포트는 입력된 정보와 성장 기록, AI 분석 결과를 바탕으로 자동 생성되며 의료적 진단을 대체하지 않습니다.
      </div>
    </div>
  )
})
ReportSheet.displayName = 'ReportSheet'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 p-3">
      <h3 className="mb-2 text-[13px] font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-[12px] text-gray-500">{label}</div>
      <div className="text-[14px] font-semibold text-gray-900 leading-snug">{value}</div>
    </div>
  )
}
