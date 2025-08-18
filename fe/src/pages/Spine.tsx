import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'

export default function Spine() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="척추 및 체형 관리" variant="light" />

      <div className="flex-1 px-4 pt-4 pb-24">
        <div className="mt-8">
          <Button label="새로 분석하기" />
        </div>
      </div>

      <BottomNav activePage="/spine" />
    </div>
  )
}
