import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="아이 맞춤 성장 로드맵" variant="light" />
      <BottomNav activePage="/" />
    </div>
  )
}
