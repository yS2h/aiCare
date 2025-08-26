import { useNavigate, useParams, Navigate } from 'react-router-dom'
import TopBar from '@/components/Topbar'
import BottomNav from '@/components/BottomNav'
import Button from '@/components/Button'

// 샘플 데이터
import Img1 from './BoneAgeExample1.jpg'
import Img2 from './BoneAgeExample2.jpg'
import Img3 from './BoneAgeExample3.jpg'

const EXAMPLES: Record<string, { takenAt: string; img: string; boneAge: string }> = {
  '1': { takenAt: '2025-08-22', img: Img1, boneAge: '16세 4개월' },
  '2': { takenAt: '2025-08-22', img: Img2, boneAge: '16세 7개월' },
  '3': { takenAt: '2025-08-22', img: Img3, boneAge: '11세 12개월' }
}

export default function BoneAgeExample() {
  const HEADER_H = 64
  const FOOTER_H = 84
  const { id } = useParams()
  const navigate = useNavigate()

  const data = (id && EXAMPLES[id]) || null
  if (!data) return <Navigate to="/bone-age" replace />

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <TopBar title="골연령 및 골격성숙도" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto max-w-[920px] px-6 pt-2 pb-4">
          <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1.5 rounded-full bg-main" />
              <h2 className="text-[15px] md:text-[16px] font-semibold text-gray-900">
                골연령 분석 결과
              </h2>
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

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <span className="text-gray-500">촬영일:</span> {data.takenAt}
              </div>
              <a
                href={data.img}
                download={`bone-age-${data.takenAt}-${id}.png`}
                className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
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

            <div className="mt-3 overflow-hidden">
              <div className="px-4 py-2 text-center">
                <span className="text-sm text-gray-600 mr-1.5">뼈나이:</span>
                <span className="text-base md:text-[15px] font-semibold text-gray-900">
                  {data.boneAge}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Button label="목록 이동하기" onClick={() => navigate(-1)} />
            </div>
          </section>
        </div>
      </main>

      <BottomNav activePage="/bone-age" />
    </div>
  )
}
