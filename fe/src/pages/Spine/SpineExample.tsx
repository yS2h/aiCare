import { useNavigate, useParams, Navigate } from 'react-router-dom'
import TopBar from '@/components/Topbar'
import BottomNav from '@/components/BottomNav'
import Button from '@/components/Button'
import Img1 from './SpineExample1.png'
import Img2 from './SpineExample2.png'
import Img3 from './SpineExample3.png'

const EXAMPLES: Record<
  string,
  { takenAt: string; img: string; rows: { id: number; angle: number; apex: string; dir: string }[] }
> = {
  '1': {
    takenAt: '2025-08-22',
    img: Img1,
    rows: [
      { id: 1, angle: 1.6, apex: 'T3', dir: '좌측' },
      { id: 2, angle: 5.2, apex: 'T7', dir: '우측' },
      { id: 3, angle: 3.1, apex: 'L1', dir: '좌측' }
    ]
  },
  '2': {
    takenAt: '2025-08-22',
    img: Img2,
    rows: [
      { id: 1, angle: 4.5, apex: 'T4', dir: '좌측' },
      { id: 2, angle: 5.0, apex: 'T8', dir: '우측' },
      { id: 3, angle: 9.9, apex: 'L1', dir: '좌측' }
    ]
  },
  '3': {
    takenAt: '2025-08-22',
    img: Img3,
    rows: [
      { id: 1, angle: 3.3, apex: 'T2', dir: '좌측' },
      { id: 2, angle: 10.9, apex: 'T7', dir: '우측' },
      { id: 3, angle: 17.7, apex: 'L1', dir: '좌측' }
    ]
  }
}

function summarizeCurves(rows: { id: number; angle: number; apex: string; dir: string }[]) {
  const sorted = [...rows].sort((a, b) => b.angle - a.angle)
  const primary = sorted[0]
  const maxAngle = primary?.angle ?? 0
  return {
    maxAngle,
    primaryApex: primary?.apex ?? '-',
    primaryDir: primary?.dir ?? '-'
  }
}

function classifyAngle(angle: number) {
  if (angle < 5) {
    return { label: '정상 범위', text: '또래 평균에 가까운 편입니다.' }
  } else if (angle < 10) {
    return { label: '경미한 불균형', text: '평균보다 약간 휘어 있습니다.' }
  } else if (angle < 20) {
    return { label: '경도', text: '평균보다 분명히 휘어 있습니다.' }
  } else if (angle < 40) {
    return { label: '중등도', text: '평균보다 많이 휘어 있습니다.' }
  }
  return { label: '중증', text: '평균 대비 크게 휘어 있습니다.' }
}

function getActions(angle: number) {
  const base = [
    '하루 10분 이상 스트레칭으로 척추의 유연성을 유지하세요.',
    '앉을 때 허리·어깨를 곧게 세우는 습관을 가지세요.',
    '주 3회 이상 코어 강화 운동(플랭크, 브릿지 등)을 권장합니다.'
  ]

  if (angle < 5) {
    base.push('생활습관 점검만으로 충분합니다.')
  } else if (angle < 10) {
    base.push('가벼운 교정 운동과 주기적 관찰을 권장합니다.')
  } else if (angle < 20) {
    base.push('물리치료·운동 전문가의 상담을 받아보는 것이 좋습니다.')
  } else if (angle < 40) {
    base.push('전문의와 상담하여 보조기·운동치료 여부를 검토하세요.')
  } else {
    base.push('전문의 진료를 꼭 받아보시길 권장합니다.')
  }

  return base
}

export default function SpineExample() {
  const HEADER_H = 64
  const FOOTER_H = 84
  const { id } = useParams()
  const navigate = useNavigate()

  const data = (id && EXAMPLES[id]) || null
  if (!data) return <Navigate to="/spine" replace />

  const { maxAngle, primaryApex, primaryDir } = summarizeCurves(data.rows)
  const level = classifyAngle(maxAngle)
  const actions = getActions(maxAngle)

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <TopBar title="척추 및 체형 관리" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto max-w-[920px] px-6 pt-2 pb-4">
          <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1.5 rounded-full bg-main" />
                <h2 className="text-[15px] md:text-[16px] font-semibold text-gray-900">
                  Cobb&apos;s angle 분석 결과
                </h2>
              </div>
              <a
                href={data.img}
                download={`cobbs-angle-${data.takenAt}-${id}.png`}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 ml-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
                <span className="sr-only md:not-sr-only md:inline">다운로드</span>
              </a>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-neutral-900 flex justify-center">
              <img
                src={data.img}
                alt={`Cobb's angle 분석 이미지 ${id}`}
                className="w-full max-w-[560px] object-contain"
                loading="lazy"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">촬영일</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{data.takenAt}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">대표 곡선</div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {primaryApex} · {primaryDir}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">최대 Cobb 각</div>
                <div className="mt-1 text-sm font-semibold text-main">{maxAngle.toFixed(1)}°</div>
              </div>
            </div>

            {/* 설명 카드 */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm text-gray-800">
                또래 평균과 비교했을 때 <span className="font-semibold">{level.text}</span>{' '}
                <span className="ml-1 text-gray-600">({level.label})</span>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                * 이 평가는 참고용이며, 정확한 진단과 처치는 반드시 의료진과 상담하세요.
              </p>
            </div>

            {/* 분석 테이블 */}
            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-gray-200">
              <table className="w-full text-sm text-gray-800 text-center">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 w-10 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Cobb&apos;s angle</th>
                    <th className="px-4 py-3 font-medium">Apex</th>
                    <th className="px-4 py-3 font-medium">휨 방향</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.rows.map(r => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 text-gray-500">{r.id}</td>
                      <td className="px-5 py-3 font-semibold">{r.angle.toFixed(1)}°</td>
                      <td className="px-4 py-3 font-semibold">{r.apex}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600">{r.dir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="text-[15px] md:text-[16px] font-semibold text-gray-900 mb-2">
                어떤 관리가 필요할까요?
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-main/30 bg-main/5 p-4">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">잠재가치는 충분합니다.</span>{' '}
                지금의 수치가 전부가 아니에요. 생활 습관을 하나씩 정돈하고,
                기록을 꾸준히 이어가면 분명 좋아질 수 있습니다. <span className="font-medium">포기하지 마세요!</span>
              </p>
            </div>

            <div className="mt-6">
              <Button label="목록 이동하기" onClick={() => navigate(-1)} />
            </div>
          </section>
        </div>
      </main>

      <BottomNav activePage="/spine" />
    </div>
  )
}
