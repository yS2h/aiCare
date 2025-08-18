import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function Consulting() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar title="AI 맞춤 상담" variant="light" />
      <BottomNav activePage="/consulting" />
    </div>
  )
}
