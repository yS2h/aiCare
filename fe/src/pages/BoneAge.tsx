import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function BoneAge() {
  const HEADER_H = 64
  const FOOTER_H = 84
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="골연령 및 골격성숙도" variant="light" />

      <main
        style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
        className="overflow-y-auto scroll-smooth"
      >
        <div className="mx-auto px-6 pt-2 pb-6 space-y-10"></div>
      </main>

      <BottomNav activePage="/bone-age" />
    </div>
  )
}
