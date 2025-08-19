import React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

type InputProps = {
  currentDate: Dayjs
  onChangeDate?: (d: Dayjs) => void
}

export default function Input({ currentDate, onChangeDate }: InputProps) {
  const days = React.useMemo(() => {
    const start = currentDate.startOf('day').subtract(3, 'day')
    return Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day')
      return {
        key: i,
        date: d,
        dayNum: d.date(),
        weekday: d.locale('ko').format('ddd').toUpperCase()
      }
    })
  }, [currentDate])

  const selected = days.findIndex(x => x.date.isSame(currentDate, 'day'))
  const label = currentDate.format('YYYY.MM.DD')

  // 달력 팝오버
  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState<Dayjs>(currentDate.startOf('month'))
  const popoverRef = React.useRef<HTMLDivElement>(null)

  // currentDate 기준준
  React.useEffect(() => {
    setViewMonth(currentDate.startOf('month'))
  }, [currentDate])

  // 닫기
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!popoverRef.current) return
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 달력용 유틸
  const weekDays = React.useMemo(() => {
    const base = dayjs().locale('ko').startOf('week') // dayjs 기본: 일요일 시작
    return Array.from({ length: 7 }, (_, i) => base.add(i, 'day').format('dd')) // '일','월',...
  }, [])

  const gridDays = React.useMemo(() => {
    // 달력 그리드 (6주, 42칸)
    const start = viewMonth.startOf('month')
    const end = viewMonth.endOf('month')
    const gridStart = start.startOf('week')
    return Array.from({ length: 42 }, (_, i) => {
      const d = gridStart.add(i, 'day')
      const isCurrentMonth = d.isSame(viewMonth, 'month')
      const isToday = d.isSame(dayjs(), 'day')
      const isSelected = d.isSame(currentDate, 'day')
      return { d, isCurrentMonth, isToday, isSelected }
    })
  }, [viewMonth, currentDate])

  const selectDate = (d: Dayjs) => {
    onChangeDate?.(d)
    setOpen(false)
  }

  return (
    <section className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between relative">
        <div className="text-[15px] font-semibold">성장 정보 등록</div>

        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-gray1"
          aria-label="날짜 선택"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation()
            setOpen(o => !o)
          }}
        >
          <span>{label}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={'opacity-70 transition-transform ' + (open ? 'rotate-180' : '')}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* 달력 팝오버 */}
        {open && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="날짜 선택 달력"
            className="absolute right-0 top-8 z-50 w-[18rem] rounded-xl border border-gray3 bg-white shadow-lg p-3"
          >
            {/* 월 변경 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="이전 달"
                onClick={() => setViewMonth(m => m.subtract(1, 'month'))}
              >
                ‹
              </button>
              <div className="text-sm font-semibold">{viewMonth.format('YYYY년 M월')}</div>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="다음 달"
                onClick={() => setViewMonth(m => m.add(1, 'month'))}
              >
                ›
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-1">
              {weekDays.map(w => (
                <div key={w} className="text-center py-1 tracking-wide">
                  {w}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map(({ d, isCurrentMonth, isToday, isSelected }) => {
                const base =
                  'h-9 rounded-lg text-sm flex items-center justify-center transition select-none'
                const color = isSelected
                  ? 'bg-black text-white'
                  : isToday
                    ? 'border border-black/40'
                    : isCurrentMonth
                      ? 'text-gray-800 hover:bg-gray-100'
                      : 'text-gray-400 hover:bg-gray-100'
                return (
                  <button
                    key={d.format('YYYY-MM-DD')}
                    type="button"
                    onClick={() => selectDate(d)}
                    className={`${base} ${color}`}
                    aria-pressed={isSelected}
                    aria-label={d.format('YYYY년 M월 D일')}
                  >
                    {d.date()}
                  </button>
                )
              })}
            </div>

            {/* 오늘로 이동 */}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md hover:bg-gray-100"
                onClick={() => setViewMonth(dayjs().startOf('month'))}
              >
                오늘로
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 요일 선택 */}
      <div className="-mx-2 px-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {days.map((d, i) => (
            <button
              key={d.key}
              onClick={() => onChangeDate?.(d.date)}
              className={
                'w-14 shrink-0 rounded-xl border text-center py-3 transition ' +
                (i === selected
                  ? 'bg-black text-white border-gray3'
                  : 'bg-white text-gray1 border-gray3')
              }
              aria-pressed={i === selected}
              aria-label={`${d.dayNum} ${d.weekday}`}
            >
              <div className="text-[15px] font-semibold leading-none">{d.dayNum}</div>
              <div className="text-[11px] tracking-wide opacity-70 mt-1">{d.weekday}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          inputMode="decimal"
          placeholder="키 (cm)"
          className="h-11 rounded-xl border border-gray3 px-4 text-[15px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
        />
        <input
          type="number"
          inputMode="decimal"
          placeholder="몸무게 (kg)"
          className="h-11 rounded-xl border border-gray3 px-4 text-[15px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
        />
      </div>
      <textarea
        rows={3}
        placeholder="특이사항"
        className="w-full rounded-xl border border-gray3 px-4 py-3 text-[15px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
      />
    </section>
  )
}
