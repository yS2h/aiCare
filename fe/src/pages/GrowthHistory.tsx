import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function GrowthHistory() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="성장 이력 관리" variant="light" />

      <div className="flex-1 px-4 pt-4 pb-24">{/* TODO: 필요한 콘텐츠 여기에 추가 */}</div>

      <BottomNav activePage="/growth-history" />
    </div>
  )
}
