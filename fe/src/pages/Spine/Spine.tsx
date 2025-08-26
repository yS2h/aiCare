// Spine/Spine.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KeyboardEvent } from 'react'
import TopBar from '@/components/Topbar'
import BottomNav from '@/components/BottomNav'

// 샘플 데이터
import Img1 from './SpineExample1.png'
import Img2 from './SpineExample2.png'
import Img3 from './SpineExample3.png'

export default function Spine() {
  const HEADER_H = 64
  const FOOTER_H = 84
  const navigate = useNavigate()

  const items = useMemo(
    () => [
      { id: 1, img: Img1, date: '2025-08-01' },
      { id: 2, img: Img2, date: '2025-07-28' },
      { id: 3, img: Img3, date: '2025-07-15' }
    ],
    []
  )

  const goDetail = (id: number) => navigate(`/spine/example/${id}`)
  const onKeyGo = (e: KeyboardEvent<HTMLButtonElement>, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goDetail(id)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-x-hidden">
      <TopBar title="척추 및 체형 관리" variant="light" />

      {/* 스크롤 영역 */}
      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="mx-auto px-6 pt-3 pb-6 max-w-[920px]">
          <ul className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map(it => (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => goDetail(it.id)}
                  onKeyDown={e => onKeyGo(e, it.id)}
                  className="group block w-full text-left focus:outline-none"
                  aria-label={`예시 ${it.id} 열기, 촬영일 ${it.date}`}
                >
                  <div className="relative w-full pt-[100%] overflow-hidden rounded-xl ring-1 ring-gray-200">
                    <img
                      src={it.img}
                      alt={`Spine example ${it.id}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="mt-1 text-center text-xs text-gray-500">{it.date}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <BottomNav activePage="/spine" />
    </div>
  )
}
