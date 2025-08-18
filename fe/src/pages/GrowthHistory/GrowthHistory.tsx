import React from 'react'
import TopBar from '../../components/Topbar'
import BottomNav from '../../components/BottomNav'
import Graph from './Graph'
import Input from './Input'
import Record from './Record'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

export default function GrowthHistory() {
  dayjs.locale('ko')
  const HEADER_H = 64
  const FOOTER_H = 84
  const [date, setDate] = React.useState(dayjs())
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="bg-white">
        <TopBar title="성장 이력 관리" variant="light" />

        {/* 스크롤 영역 */}
        <main
          style={{ height: `calc(100dvh - ${HEADER_H + FOOTER_H}px)` }}
          className="overflow-y-auto scroll-smooth"
        >
          <div className="mx-auto px-6 pt-2 pb-6 space-y-8">
            <Graph />
            <Input currentDate={date} onChangeDate={setDate} />
            <Record />
          </div>
        </main>

        <BottomNav activePage="/growth-history" />
      </div>
    </div>
  )
}
