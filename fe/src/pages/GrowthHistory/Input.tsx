import React from 'react'
import { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

type InputProps = {
  currentDate: Dayjs
  onChangeDate?: (d: Dayjs) => void
}

export default function Input({ currentDate, onChangeDate }: InputProps) {
  {
    /* currentDate 기준 7일 */
  }
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

  return (
    <section className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold">성장 정보 등록</div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-gray1"
          aria-label="날짜 선택"
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
            className="opacity-70"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
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
