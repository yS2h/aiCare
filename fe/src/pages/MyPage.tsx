import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'

export default function MyPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar title="마이페이지" variant="light" />

      <BottomNav activePage="/mypage" />
    </div>
  )
}
