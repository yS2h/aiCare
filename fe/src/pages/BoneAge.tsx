import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'

export default function BoneAge() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="골연령 및 골격성숙도" variant="light" />

      <div className="flex-1 px-4 pt-4 pb-24">{/* TODO: 필요한 콘텐츠 여기에 추가 */}</div>

      <Button label="새로 분석하기" />

      <BottomNav activePage="/bone-age" />
    </div>
  )
}
