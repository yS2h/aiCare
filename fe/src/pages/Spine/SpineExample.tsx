// Spine/SpineExample.tsx
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import TopBar from '@/components/Topbar'
import BottomNav from '@/components/BottomNav'
import Button from '@/components/Button'

import Img1 from './SpineExample1.png'
import Img2 from './SpineExample2.png'
import Img3 from './SpineExample3.png'

// 샘플 데이터
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

export default function SpineExample() {
  const HEADER_H = 64
  const FOOTER_H = 84
  const { id } = useParams()
  const navigate = useNavigate()

  const data = (id && EXAMPLES[id]) || null
  if (!data) return <Navigate to="/spine" replace />

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <TopBar title="척추 및 체형 관리" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto max-w-[920px] px-6 pt-2 pb-4">
          <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1.5 rounded-full bg-main" />
              <h2 className="text-[15px] md:text-[16px] font-semibold text-gray-900">
                Cobb&apos;s angle 분석 결과
              </h2>
            </div>

            {/* 이미지 */}
            <div className="mt-3 overflow-hidden rounded-xl bg-neutral-900 flex justify-center">
              <img
                src={data.img}
                alt={`Cobb's angle 분석 이미지 ${id}`}
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
                download={`cobbs-angle-${data.takenAt}-${id}.png`}
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

            {/* 분석 테이블 */}
            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-gray-200">
              <table className="w-full text-sm text-gray-800 text-center">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 w-10 font-medium align-middle">#</th>
                    <th className="px-4 py-3 font-medium align-middle">Cobb&apos;s angle</th>
                    <th className="px-4 py-3 font-medium align-middle">Apex</th>
                    <th className="px-4 py-3 font-medium align-middle">휨 방향</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.rows.map(r => (
                    <tr key={r.id} className="bg-white">
                      <td className="px-5 py-3 text-gray-500 align-middle">{r.id}</td>
                      <td className="px-5 py-3 font-semibold align-middle">
                        {r.angle.toFixed(1)}°
                      </td>
                      <td className="px-4 py-3 font-semibold align-middle">{r.apex}</td>
                      <td className="px-4 py-3 font-semibold text-indigo-600 align-middle">
                        {r.dir}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 뒤로가기 */}
            <div className="mt-4">
              <Button label="목록 이동하기" onClick={() => navigate(-1)} />
            </div>
          </section>
        </div>
      </main>

      <BottomNav activePage="/spine" />
    </div>
  )
}
