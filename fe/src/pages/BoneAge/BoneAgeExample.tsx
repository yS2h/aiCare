import { useNavigate, useParams, Navigate } from 'react-router-dom'
import TopBar from '@/components/Topbar'
import BottomNav from '@/components/BottomNav'
import Button from '@/components/Button'
import Img1 from './BoneAgeExample1.jpg'
import Img2 from './BoneAgeExample2.jpg'
import Img3 from './BoneAgeExample3.jpg'

type Example = {
  takenAt: string
  img: string
  boneAge: string
  chronAge: string
  currentHeightCm: number
  heightPercentile: number
  predictedHeight: string
}

const EXAMPLES: Record<string, Example> = {
  '1': {
    takenAt: '2025-08-01',
    img: Img1,
    boneAge: '16세 4개월',
    chronAge: '15세 10개월',
    currentHeightCm: 168.2,
    heightPercentile: 60,
    predictedHeight: '123.2 cm'
  },
  '2': {
    takenAt: '2025-07-28',
    img: Img2,
    boneAge: '16세 7개월',
    chronAge: '16세 4개월',
    currentHeightCm: 172.1,
    heightPercentile: 75,
    predictedHeight: '165.1 cm'
  },
  '3': {
    takenAt: '2025-07-15',
    img: Img3,
    boneAge: '11세 12개월',
    chronAge: '13세 0개월',
    currentHeightCm: 145.0,
    heightPercentile: 20,
    predictedHeight: '150.4 cm'
  }
}

function toTotalMonths(korAge: string): number {
  const m = korAge.match(/(\d+)\s*세\s*(\d+)\s*개월/)
  if (!m) return 0
  const years = parseInt(m[1], 10)
  const months = parseInt(m[2], 10)
  return years * 12 + months
}

function analyzeMaturity(boneAgeStr: string, chronAgeStr: string) {
  const b = toTotalMonths(boneAgeStr)
  const c = toTotalMonths(chronAgeStr)
  const diff = b - c
  const abs = Math.abs(diff)

  const how =
    diff === 0
      ? '차이가 거의 없습니다.'
      : diff > 0
      ? `${abs}개월 정도 빠른 편입니다.`
      : `${abs}개월 정도 느린 편입니다.`

  return { diff, abs, how }
}

function buildManagement(heightPct: number, maturityDiff: number) {
  const items: string[] = []

  items.push('규칙적인 수면과 균형 잡힌 식단을 유지하세요.')
  items.push('주 3회 이상 전신 유산소 + 가벼운 근력운동을 권장합니다.')
  items.push('3~6개월 간격으로 성장기록을 업데이트하며 추세를 확인하세요.')

  if (heightPct <= 25) {
    items.push('현재 키가 또래 평균보다 낮은 편이므로 단백질·칼슘·비타민D 섭취와 생활습관 점검이 필요합니다.')
  } else if (maturityDiff >= 3) {
    items.push('골성숙이 빠른 편이므로 성장 급등기 이후 속도 둔화를 고려해 체중·영양 균형을 특히 관리하세요.')
  } else if (heightPct >= 75) {
    items.push('성장 속도가 빠른 편이라면 과도한 체중증가를 예방하고, 유연성 운동을 병행하세요.')
  } else if (maturityDiff <= -3) {
    items.push('골성숙이 느린 편이라면 추후 성장 여지가 있으니 장기 추세 관찰이 중요합니다.')
  }

  return items
}

export default function BoneAgeExample() {
  const HEADER_H = 64
  const FOOTER_H = 84
  const { id } = useParams()
  const navigate = useNavigate()

  const data = (id && EXAMPLES[id]) || null
  if (!data) return <Navigate to="/bone-age" replace />

  const maturity = analyzeMaturity(data.boneAge, data.chronAge)
  const mgmt = buildManagement(data.heightPercentile, maturity.diff)

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <TopBar title="골연령 및 성장 예측" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto max-w-[920px] px-6 pt-2 pb-4">
          <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
            {/* 타이틀 + 다운로드 버튼 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1.5 rounded-full bg-main" />
                <h2 className="text-[15px] md:text-[16px] font-semibold text-gray-900">
                  검사 결과
                </h2>
              </div>

              <a
                href={data.img}
                download={`bone-age-${data.takenAt}-${id}.png`}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 ml-4"
                aria-label="이미지 다운로드"
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

            {/* 이미지 */}
            <div className="mt-3 overflow-hidden rounded-xl bg-neutral-900 flex justify-center">
              <img
                src={data.img}
                alt={`Bone age 분석 이미지 ${id}`}
                className="w-full max-w-[560px] object-contain"
                loading="lazy"
              />
            </div>

            {/* 요약 카드 */}
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">촬영일</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{data.takenAt}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">골연령</div>
                <div className="mt-1 text-sm font-medium text-gray-900">{data.boneAge}</div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">현재 키</div>
                <div className="mt-1 text-sm font-medium text-gray-900">
                  {data.currentHeightCm.toFixed(1)} cm · 백분위 {data.heightPercentile}%
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div className="mt-6 text-sm text-gray-700 leading-relaxed">
              <p className="mb-2">
                부모님의 키와 지금까지 기록한 성장데이터, 그리고 촬영된 손목 X-ray를 함께 고려해 분석했습니다.
              </p>
              <p className="mb-2">
                또래 평균과 비교했을 때 골성숙은 <span className="font-medium">{maturity.how}</span>
                (기준 역연령 {data.chronAge}). 개인차가 크기 때문에 추세를 꾸준히 관찰하는 것이 무엇보다 중요합니다.
              </p>
            </div>

            {/* 예측 키 박스 */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-gray-700 mb-3">예상 최종 키</p>
              <p className="text-xl font-bold text-main">{data.predictedHeight}</p>
              <p className="mt-2 text-xs text-gray-500">
                (현재 키 {data.currentHeightCm.toFixed(1)} cm, 백분위 {data.heightPercentile}% 참고)
              </p>
            </div>

            {/* 관리 가이드 */}
            <div className="mt-6">
              <h3 className="text-[15px] md:text-[16px] font-semibold text-gray-900 mb-2">
                어떤 관리가 필요할까요?
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {mgmt.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            {/* 동기부여 메시지 */}
            <div className="mt-6 rounded-2xl border border-main/30 bg-main/5 p-4">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">잠재가치는 충분합니다.</span>{' '}
                지금의 수치가 전부가 아니에요. 생활 습관을 하나씩 정돈하고,
                기록을 꾸준히 이어가면 결과는 분명 달라집니다. <span className="font-medium">포기하지 마세요!</span>
              </p>
            </div>

            {/* 뒤로가기 */}
            <div className="mt-6">
              <Button label="목록 이동하기" onClick={() => navigate(-1)} />
            </div>
          </section>
        </div>
      </main>

      <BottomNav activePage="/bone-age" />
    </div>
  )
}
