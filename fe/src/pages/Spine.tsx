import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function Spine() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="척추 및 체형 관리" variant="light" />

      <BottomNav activePage="/spine" />
    </div>
  )
}
