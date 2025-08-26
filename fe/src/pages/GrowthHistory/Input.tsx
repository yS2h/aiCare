import * as React from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { upsertGrowth, type GrowthRecordUpsertBody } from '@/api/Growth/usePostGrowth'
import Button from '@/components/Button'

type InputProps = {
  currentDate: Dayjs
  onChangeDate?: (d: Dayjs) => void
}

export default function Input({ currentDate, onChangeDate }: InputProps) {
  const [height, setHeight] = React.useState('')
  const [weight, setWeight] = React.useState('')
  const [note, setNote] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState<Dayjs>(currentDate.startOf('month'))
  const [saving, setSaving] = React.useState(false)

  const popoverRef = React.useRef<HTMLDivElement>(null)
  const stripRef = React.useRef<HTMLDivElement>(null)
  const selectedRef = React.useRef<HTMLButtonElement>(null)

  const handleSave = async () => {
    if (!height || !weight) {
      alert('키와 몸무게는 모두 필수입니다.')
      return
    }
    const h = parseFloat(height)
    const w = parseFloat(weight)
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
      alert('키/몸무게는 0보다 큰 숫자여야 합니다.')
      return
    }

    const body: GrowthRecordUpsertBody = {
      recorded_at: currentDate.format('YYYY-MM-DD'),
      height_cm: h,
      weight_kg: w,
      bmi: null,
      notes: note.trim() || null
    }

    try {
      setSaving(true)
      await upsertGrowth(body)
      setNote('')
      setHeight('')
      setWeight('')

      window.dispatchEvent(new CustomEvent('growth:updated'))

      alert('저장 완료')
    } catch (e) {
      console.error(e)
      alert('저장 실패')
    } finally {
      setSaving(false)
    }
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

  React.useEffect(() => {
    if (!stripRef.current || !selectedRef.current) return
    try {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
      return
    } catch {}
    const container = stripRef.current
    const el = selectedRef.current
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const offset = elRect.left - containerRect.left + container.scrollLeft
    const target = offset - container.clientWidth / 2 + elRect.width / 2
    container.scrollTo({ left: target, behavior: 'smooth' })
  }, [currentDate])

  React.useEffect(() => {
    setViewMonth(currentDate.startOf('month'))
  }, [currentDate])

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

  const weekDays = React.useMemo(() => {
    const base = dayjs().locale('ko').startOf('week')
    return Array.from({ length: 7 }, (_, i) => base.add(i, 'day').format('dd'))
  }, [])

  const gridDays = React.useMemo(() => {
    const start = viewMonth.startOf('month')
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

        {open && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="날짜 선택 달력"
            className="absolute right-0 top-8 z-50 w-[18rem] rounded-xl border border-gray3 bg-white shadow-lg p-3"
          >
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

            <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-1">
              {weekDays.map(w => (
                <div key={w} className="text-center py-1 tracking-wide">
                  {w}
                </div>
              ))}
            </div>

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

      <div className="-mx-2 px-2 overflow-x-auto no-scrollbar" ref={stripRef}>
        <div className="flex gap-2 min-w-max">
          {days.map((d, i) => {
            const isSelected = i === selected
            return (
              <button
                key={d.key}
                ref={isSelected ? selectedRef : undefined}
                onClick={() => onChangeDate?.(d.date)}
                className={
                  'w-14 shrink-0 rounded-xl border text-center py-3 transition ' +
                  (isSelected
                    ? 'bg-black text-white border-gray3'
                    : 'bg-white text-gray1 border-gray3')
                }
                aria-pressed={isSelected}
                aria-label={`${d.dayNum} ${d.weekday}`}
              >
                <div className="text-[15px] font-semibold leading-none">{d.dayNum}</div>
                <div className="text-[12px] tracking-wide opacity-70 mt-1">{d.weekday}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="키 (cm)"
          value={height}
          onChange={e => setHeight(e.target.value)}
          className="h-10 rounded-[10px] border border-gray3 px-4 text-[14px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
        />
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="몸무게 (kg)"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="h-10 rounded-[10px] border border-gray3 px-4 text-[14px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
        />
      </div>
      <div className="grid gap-3">
        <textarea
          rows={3}
          placeholder="특이사항(오늘 무엇을 먹었는지 같은 사소한 이야기를 적어주세요)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full rounded-[10px] border border-gray3 px-4 py-3 text-[14px] placeholder:text-gray2 focus:outline-none focus:ring-1 focus:ring-gray3"
        />
        <Button
          label={saving ? '저장 중…' : '성장이력 저장하기'}
          onClick={handleSave}
          disabled={saving}
        />
      </div>
    </section>
  )
}
