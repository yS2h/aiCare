import TopBar from '../components/Topbar'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'

export default function Guide() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <TopBar title="종합 성장 가이드" variant="light" />

      <div className="flex-1 px-4 pt-4 pb-24">{/* TODO: 필요한 콘텐츠 여기에 추가 */}</div>

      <Button label="PDF 저장하기" />

      <BottomNav activePage="/guide" />
    </div>
  )
}
