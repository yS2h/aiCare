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
  date: string // YYYY-MM-DD
  height: number // cm
  weight: number // kg
}
type DietRecord = {
  date: string
  kcal?: number
  protein_g?: number
  note?: string
}
type SpineRecord = {
  date: string
  postureType?: string
  scoliosisRisk?: '낮음' | '중간' | '높음' | string
  mainCobb?: number
  note?: string
}
type BoneAgeRecord = {
  date: string
  boneAgeYears?: number
  phvNote?: string
}

/** ========= Small utils ========= */
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

const daysBetween = (a: Date, b: Date) => Math.abs(+b - +a) / (1000 * 60 * 60 * 24)
const monthsBetween = (a: Date, b: Date) => daysBetween(a, b) / 30.437

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
    } catch { /* ignore */ }
  }
  return {}
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

        const fromMe: Partial<UserInfo> = me ? {
          name: pickStr(me, ['name', 'username', 'childName']),
          sex: pickStr(me, ['sex', 'gender']),
          age: pickNum(me, ['age']),
          birthDate: pickStr(me, ['birthDate', 'birth', 'birthday'])
        } : {}

        const fromStorage = loadInfoFromStorage()
        const merged: UserInfo = {
          name: fromStorage.name ?? fromMe.name,
          sex: fromStorage.sex ?? fromMe.sex,
          age: fromStorage.age ?? fromMe.age ?? calcAgeFromBirth(fromStorage.birthDate ?? fromMe.birthDate),
          birthDate: fromStorage.birthDate ?? fromMe.birthDate
        }
        if (mounted) setData(merged)
      } catch {
        if (mounted) setData(loadInfoFromStorage() as UserInfo)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
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

        const norm: GrowthPoint[] = (arr || []).map(r => {
          const date = (
            pickStr(r, ['recorded_at', 'date', 'measuredAt', 'created_at', 'createdAt']) ??
            new Date().toISOString()
          ).slice(0, 10)
          const height = pickNum(r, ['height_cm', 'height', 'heightCm', 'cm'])
          const weight = pickNum(r, ['weight_kg', 'weight', 'weightKg', 'kg'])
          if (typeof height !== 'number' || typeof weight !== 'number') return null as any
          return { date, height, weight }
        }).filter(Boolean) as GrowthPoint[]

        norm.sort((a, b) => (a.date > b.date ? 1 : -1))
        if (mounted) setData(norm)
      } catch {
        if (mounted) setData([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return { data, loading }
}

function useDiet(): { data: DietRecord[]; loading: boolean } {
  const [data, setData] = React.useState<DietRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/diet`, { credentials: 'include' })
        const j: any = await res.json().catch(() => null)
        const arr: any[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []

        const norm: DietRecord[] = (arr || []).map(r => ({
          date: (pickStr(r, ['date', 'recorded_at', 'created_at']) ?? new Date().toISOString()).slice(0, 10),
          kcal: pickNum(r, ['kcal', 'calorie', 'calories']),
          protein_g: pickNum(r, ['protein_g', 'proteinG', 'protein']),
          note: pickStr(r, ['note', 'memo', 'description'])
        }))
        if (mounted) setData(norm)
      } catch { if (mounted) setData([]) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])
  return { data, loading }
}

function useSpine(): { data: SpineRecord[]; loading: boolean } {
  const [data, setData] = React.useState<SpineRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/spine`, { credentials: 'include' })
        const j: any = await res.json().catch(() => null)
        const arr: any[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []

        const norm: SpineRecord[] = (arr || []).map(r => ({
          date: (pickStr(r, ['date, recorded_at', 'created_at']) ?? pickStr(r, ['date', 'recorded_at', 'created_at']) ?? new Date().toISOString()).slice(0, 10),
          postureType: pickStr(r, ['postureType', 'posture', 'type']),
          scoliosisRisk: pickStr(r, ['scoliosisRisk', 'risk']),
          mainCobb: pickNum(r, ['mainCobb', 'cobb', 'angle']),
          note: pickStr(r, ['note', 'memo', 'description'])
        }))
        if (mounted) setData(norm)
      } catch { if (mounted) setData([]) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])
  return { data, loading }
}

function useBoneAge(): { data: BoneAgeRecord[]; loading: boolean } {
  const [data, setData] = React.useState<BoneAgeRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/boneage`, { credentials: 'include' })
        const j: any = await res.json().catch(() => null)
        const arr: any[] = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []

        const norm: BoneAgeRecord[] = (arr || []).map(r => ({
          date: (pickStr(r, ['date', 'recorded_at', 'created_at']) ?? new Date().toISOString()).slice(0, 10),
          boneAgeYears: pickNum(r, ['boneAgeYears', 'bone_age_years', 'boneAge']),
          phvNote: pickStr(r, ['phvNote', 'phv', 'note'])
        }))
        if (mounted) setData(norm)
      } catch { if (mounted) setData([]) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])
  return { data, loading }
}

function slope(values: number[]) {
  if (values.length < 2) return 0
  const first = values[0]
  const last = values[values.length - 1]
  return (last - first) / (values.length - 1)
}

function inferPHVText(user: UserInfo | null, growth: GrowthPoint[], bone: BoneAgeRecord[]): string {
  if (!growth.length) return '최근 측정 데이터가 부족하여 PHV 추정이 제한적입니다.'
  const sex = (user?.sex ?? '').toString() // 경고 방지 + 성별 분기 여지
  const recent = growth.slice(-6)
  const hSlp = slope(recent.map(r => r.height))

  if (hSlp >= 0.5) {
    return '최근 키 증가 속도가 빠른 편으로, PHV(성장 급등기)에 진입했거나 근접한 것으로 보입니다. 영양·수면·자세 관리에 특히 신경 써 주세요.'
  }
  if (hSlp >= 0.2) {
    return '키 증가가 안정적으로 이어지고 있습니다. 현재 예측 범위 내에서 성장이 잘 진행 중입니다.'
  }
  const lastBone = bone[bone.length - 1]
  if (lastBone?.phvNote) return lastBone.phvNote

  if (/여/.test(sex)) {
    return '최근 증가 폭이 크지 않지만, 여아는 개인차가 큽니다. 규칙적인 활동과 충분한 수면을 유지해 주세요.'
  }
  return '최근 증가 폭이 크지 않지만, 개인차가 존재합니다. 규칙적인 활동과 충분한 수면을 유지해 주세요.'
}

function summarizeDiet(diet: DietRecord[], latestWeight?: number): { text: string; targetProtein?: number } {
  if (!diet.length) return { text: '최근 기록된 식단 데이터가 없습니다.' }
  const last7 = diet.slice(-7)
  const avgKcal = Math.round(last7.reduce((a, b) => a + (b.kcal ?? 0), 0) / last7.length || 0)
  const avgProtein = +(last7.reduce((a, b) => a + (b.protein_g ?? 0), 0) / last7.length || 0).toFixed(1)
  const targetProtein = latestWeight ? Math.round(latestWeight * 1.2) : undefined
  const proteinHint = targetProtein
    ? (avgProtein >= targetProtein * 0.9 ? '목표에 근접' : '목표 대비 보강 권장')
    : (avgProtein >= 40 ? '적절' : '보강 권장')
  return {
    text: `최근 1주 평균 ${avgKcal} kcal, 단백질 ${avgProtein} g 수준입니다. ${proteinHint}. 칼슘·비타민 D 식품(유제품, 잎채소)과 수분 섭취도 꾸준히 챙겨 주세요.`,
    targetProtein
  }
}

function summarizeSpine(spine: SpineRecord[]): string {
  if (!spine.length) return '최근 척추/자세 분석 데이터가 없습니다.'
  const last = spine[spine.length - 1]
  const risk = last.scoliosisRisk ?? '평가값 없음'
  const cobb = typeof last.mainCobb === 'number' ? `${last.mainCobb.toFixed(1)}°` : '측정치 없음'
  const posture = last.postureType ?? '일반'
  return `최근 자세 분석은 "${posture}"이며, 측만 위험도는 "${risk}" 수준, 메인 Cobb 각도는 ${cobb}입니다. 장시간 앉기·스마트폰 시 목/어깨 스트레칭을 권장합니다.`
}

function buildPraise(user: UserInfo | null, growth: GrowthPoint[], diet: DietRecord[], spine: SpineRecord[]): string {
  const name = user?.name ? `${user.name}님` : '보호자님'
  const goodDiet = diet.slice(-7).some(d => (d.protein_g ?? 0) >= 40)
  const stableMeasure = growth.length >= 3
  const spineCare = spine.slice(-2).some(s => (s.postureType ?? '').includes('정상'))
  const tokens: string[] = []
  if (stableMeasure) tokens.push('꾸준한 기록 관리')
  if (goodDiet) tokens.push('균형 잡힌 식사 준비')
  if (spineCare) tokens.push('자세 개선 노력')
  if (!tokens.length) {
    return `${name}, 아이 건강을 위해 관심 갖고 관리해 주시는 점이 가장 큰 힘이 됩니다. 지금처럼 차분하게 함께 가요!`
  }
  return `${name}, ${tokens.join(' · ')} 덕분에 아이 성장 환경이 잘 유지되고 있어요. 지금의 좋은 흐름을 함께 이어가요!`
}

function computeMonthlyRates(growth: GrowthPoint[]) {
  if (growth.length < 2) return { hRate: undefined as number | undefined, wRate: undefined as number | undefined }
  const lastN = growth.slice(-6)
  const first = lastN[0]
  const last = lastN[lastN.length - 1]
  const a = new Date(first.date)
  const b = new Date(last.date)
  const months = Math.max(0.1, monthsBetween(a, b))
  const hRate = +(((last.height - first.height) / months)).toFixed(2)
  const wRate = +(((last.weight - first.weight) / months)).toFixed(2)
  return { hRate, wRate }
}

function estimatePHVWindow(user: UserInfo | null, bone: BoneAgeRecord[]) {
  const sex = (user?.sex ?? '').toString()
  const chronological = user?.age
  const boneAge = bone[bone.length - 1]?.boneAgeYears
  const ageForEst = boneAge ?? chronological
  if (!ageForEst) return 'PHV 예상 시기를 추정할 정보가 부족합니다.'
  const target = /여|girl|female/i.test(sex) ? 11.5 : 13.5 
  const diff = +(target - ageForEst).toFixed(1)
  if (diff > 0.8) return `PHV까지 약 ${diff.toFixed(1)}년(±0.5년) 남은 것으로 추정됩니다.`
  if (diff > 0.0) return `PHV가 임박(약 ${diff.toFixed(1)}년 이내)한 구간으로 보입니다.`
  return 'PHV 구간을 이미 지나고 있거나 막 지난 것으로 추정됩니다.'
}

function nextActions(
  latest: GrowthPoint | null,
  diet: { text: string; targetProtein?: number },
  spine: SpineRecord[]
) {
  const items: string[] = []

  const m = diet.text.match(/단백질\s([\d.]+)\s*g/)
  const avgProteinParsed = m && m[1] ? parseFloat(m[1]) : 0

  const target = diet.targetProtein ?? 0
  const gap = target - (avgProteinParsed || 0)

  if (diet.targetProtein && latest) {
    if (gap > 5) {
      items.push(`단백질을 하루 약 ${Math.round(gap)}g 보강(살코기·달걀·두부·콩)`)
    }
  }

  const lastSp = spine[spine.length - 1]
  if (lastSp?.scoliosisRisk === '높음' || (lastSp?.mainCobb ?? 0) >= 10) {
    items.push('척추 전문의 상담 및 정기 추적 권장')
  } else {
    items.push('주 3~4회, 10~15분 스트레칭(가슴 펴기·견갑 안정화·햄스트링)')
  }

  items.push('2~4주 간격으로 키·몸무게 재측정 및 기록')
  return items.slice(0, 4)
}

export default function Guide() {
  const HEADER_H = 64
  const FOOTER_H = 84

  const { data: user } = useUserInfo()
  const { data: growth } = useGrowth()
  const { data: diet } = useDiet()
  const { data: spine } = useSpine()
  const { data: bone } = useBoneAge()

  const latest = growth.length ? growth[growth.length - 1] : null
  const bmi = latest ? calcBMI(latest.weight, latest.height) : undefined

  const sheetRef = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    const el = sheetRef.current
    if (!el) return
    const filename = `aicare-report-${user?.name ?? 'user'}-${latest?.date ?? ''}.pdf`
    await wait(100)
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
      const s = Math.min(pageW / canvas.width, pageH / canvas.height) // ✅ 한 페이지 맞춤
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

  const phvText = useMemo(() => inferPHVText(user, growth, bone), [user, growth, bone])
  const dietSum = useMemo(() => summarizeDiet(diet, latest?.weight), [diet, latest])
  const spineText = useMemo(() => summarizeSpine(spine), [spine])
  const praiseText = useMemo(() => buildPraise(user, growth, diet, spine), [user, growth, diet, spine])
  const rates = useMemo(() => computeMonthlyRates(growth), [growth])
  const phvWindow = useMemo(() => estimatePHVWindow(user, bone), [user, bone])
  const actions = useMemo(() => nextActions(latest, dietSum, spine), [latest, dietSum, spine])

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-x-hidden">
      <TopBar title="종합 성장 가이드" variant="light" />
      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden scroll-smooth flex justify-center px-4 pt-2 pb-4"
      >
        <div className="w-full">
          <ReportSheet
            ref={sheetRef}
            user={user}
            growth={growth}
            bmi={bmi}
            phvText={phvText}
            dietText={dietSum.text}
            targetProtein={dietSum.targetProtein}
            spineText={spineText}
            praiseText={praiseText}
            rates={rates}
            phvWindow={phvWindow}
            actions={actions}
          />
          <div className="mt-3">
            <Button label="PDF 저장하기" onClick={downloadPDF} style={{ maxWidth: 'none', borderRadius: 12 }} />
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
    phvText: string
    dietText: string
    targetProtein?: number
    spineText: string
    praiseText: string
    rates: { hRate?: number; wRate?: number }
    phvWindow: string
    actions: string[]
  }
>(({ user, growth, bmi, phvText, dietText, targetProtein, spineText, praiseText, rates, phvWindow, actions }, ref) => {
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123
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

  const recent3 = useMemo(() => [...growth].slice(-3).reverse(), [growth])

  return (
    <div
      ref={ref}
      id="report-sheet"
      className="bg-white rounded-xl border border-gray-200 shadow-sm"
      style={{
        width: '100%',
        maxWidth: A4_WIDTH,
        minHeight: A4_HEIGHT,
        padding: 16,
        boxSizing: 'border-box'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-extrabold tracking-tight text-gray-900">
            aiCare <span className="text-gray-500 text-xs align-middle">성장 리포트</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 text-[12px] text-gray-600">
            <div><span className="text-gray-500">이름</span> : {user?.name ?? '-'}</div>
            <div><span className="text-gray-500">성별</span> : {user?.sex ?? '-'}</div>
            <div><span className="text-gray-500">나이</span> : {user?.age ?? '-'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-600 whitespace-nowrap">최근 측정일</div>
          <div className="text-[13px] font-semibold text-gray-900 whitespace-nowrap leading-tight">{dateText}</div>
        </div>
      </div>

      <div className="my-3 h-px bg-gray-200" />

      <div className="grid grid-cols-1 gap-3">
        <Card title="핵심 지표">
          <div className="grid grid-cols-3 gap-2">
            <KPI label="키" value={latest ? `${latest.height.toFixed(1)} cm` : '-'} />
            <KPI label="체중" value={latest ? `${latest.weight.toFixed(1)} kg` : '-'} />
            <KPI label="BMI" value={bmi !== undefined ? String(bmi) : '-'} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <section className="border border-gray-200 rounded-xl p-3">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-2">키 추이</h3>
            <div style={{ height: 160, overflow: 'hidden' }}>
              <GrowthGraph data={graphRecords as any} compact fixedMetric="height" hideToggle title="" />
            </div>
          </section>
          <section className="border border-gray-200 rounded-xl p-3">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-2">몸무게 추이</h3>
            <div style={{ height: 160, overflow: 'hidden' }}>
              <GrowthGraph data={graphRecords as any} compact fixedMetric="weight" hideToggle title="" />
            </div>
          </section>
        </div>

        {/* 종합 코멘트 */}
        <section className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2">종합 코멘트</h3>
          <ul className="text-[12px] text-gray-700 leading-relaxed list-disc pl-4 space-y-1">
            <li><span className="font-semibold text-gray-900">요약</span> — 최근 측정값을 기반으로 성장 상태를 점검했습니다. 그래프에서 단기 추세와 변동성을 확인하세요.</li>
            <li><span className="font-semibold text-gray-900">PHV 관점</span> — {phvText}</li>
            <li>
              <span className="font-semibold text-gray-900">식단</span> — {`${dietText}${targetProtein ? ` (권장 단백질 목표: 약 ${targetProtein} g/일)` : ''}`}
            </li>
            <li><span className="font-semibold text-gray-900">척추/자세</span> — {spineText}</li>
          </ul>
        </section>

        {/* 세부 해석 */}
        <section className="border border-gray-200 rounded-xl p-3">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2">세부 해석</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div>
                <div className="text-[12px] font-semibold text-gray-900">성장 속도 & PHV 타임라인</div>
                <p className="text-[11px] text-gray-700 leading-relaxed">
                  최근 구간 속도: 키 {rates.hRate !== undefined ? `${rates.hRate} cm/월` : '-'}, 체중 {rates.wRate !== undefined ? `${rates.wRate} kg/월` : '-'}.
                  {' '}{phvWindow}
                </p>
              </div>

              <div>
                <div className="text-[12px] font-semibold text-gray-900">최근 3회 측정 요약</div>
                <table className="w-full text-[11px] text-gray-700 mt-1">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-2">일자</th>
                      <th className="py-1 pr-2">키</th>
                      <th className="py-1">몸무게</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent3.map(r => (
                      <tr key={r.date} className="border-t border-gray-100">
                        <td className="py-1 pr-2">{r.date.replace(/-/g, '.')}</td>
                        <td className="py-1 pr-2">{r.height.toFixed(1)} cm</td>
                        <td className="py-1">{r.weight.toFixed(1)} kg</td>
                      </tr>
                    ))}
                    {!recent3.length && (
                      <tr><td colSpan={3} className="py-1 text-gray-500">데이터가 없습니다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-[12px] font-semibold text-gray-900">영양 가이드</div>
                <ul className="text-[11px] text-gray-700 leading-relaxed list-disc pl-4">
                  <li>단백질은 하루 {targetProtein ? `${targetProtein} g` : '체중×1.2 g'} 내외를 목표로 분산 섭취</li>
                  <li>칼슘·비타민 D 식품(유제품·멸치·잎채소)과 물 충분히 섭취</li>
                  <li>가공당·야식 과다 섭취는 성장 호르몬 분비에 불리</li>
                </ul>
              </div>

              <div>
                <div className="text-[12px] font-semibold text-gray-900">자세·운동 가이드</div>
                <ul className="text-[11px] text-gray-700 leading-relaxed list-disc pl-4">
                  <li>하루 10~15분 스트레칭(가슴·승모·햄스트링)로 자세 밸런스 유지</li>
                  <li>스마트폰·학습 시 30~40분마다 목·어깨 풀기</li>
                  <li>측만 위험도/각도 상승 시 전문의 상담 및 정기 추적</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 다음 단계 & 격려 */}
        <section className="grid grid-cols-2 gap-3">
          <div className="border border-gray-200 rounded-xl p-3">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-1">다음 단계(권장)</h3>
            <ul className="text-[11px] text-gray-700 leading-relaxed list-disc pl-4">
              {actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-1">부모님께 드리는 메시지</h3>
            <p className="text-[11px] text-gray-800 leading-relaxed">{praiseText}</p>
          </div>
        </section>
      </div>

      <div className="mt-3 text-[10px] text-gray-500">
        본 가이드는 정보 입력 및 성장 기록, 식단 기록, 의료영상 분석 결과를 바탕으로 산출된 참고용 지표입니다.
      </div>
    </div>
  )
})
ReportSheet.displayName = 'ReportSheet'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-xl p-3">
      <h3 className="text-[13px] font-semibold text-gray-900 mb-2">{title}</h3>
      {children}
    </section>
  )
}
function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <div className="text-[12px] text-gray-500 mb-1">{label}</div>
      <div className="text-[14px] font-semibold text-gray-900 leading-snug">{value}</div>
    </div>
  )
}
