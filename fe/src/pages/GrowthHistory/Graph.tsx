// src/pages/growth-history/Graph.tsx
import * as React from 'react'
import api from '@/api/instance'
import dayjs from 'dayjs'

type GrowthRecord = {
  id: string
  child_id: string
  recorded_at: string
  height_cm: number
  weight_kg: number
  bmi: number
  notes?: string | null
  created_at: string
  updated_at: string
}

type Metric = 'height' | 'weight'

export default function Graph() {
  const [raw, setRaw] = React.useState<GrowthRecord[]>([])
  const [metric, setMetric] = React.useState<Metric>('height')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  // 성장이력 가져오기
  React.useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<{ success: true; data: GrowthRecord[] }>('/growth')
        setRaw(res.data?.data ?? [])
      } catch (e: any) {
        setError('성장 이력을 불러오지 못했습니다.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchList()
  }, [])

  const points = React.useMemo(() => {
    const sorted = [...(raw ?? [])].sort(
      (a, b) => dayjs(a.recorded_at).valueOf() - dayjs(b.recorded_at).valueOf()
    )
    return sorted
      .map(r => ({
        label: dayjs(r.recorded_at).format('MM.DD'),
        value: metric === 'height' ? r.height_cm : r.weight_kg
      }))
      .filter(p => Number.isFinite(p.value))
  }, [raw, metric])

  const futureValues = React.useMemo(() => {
    if (points.length < 2) return []
    const last = points[points.length - 1].value
    const prev = points[points.length - 2].value
    const slope = (last - prev) * 0.8 // 살짝 완만하게
    return [last + slope, last + 2 * slope]
  }, [points])

  const height = 220
  const padding = { top: 18, right: 16, bottom: 26, left: 36 }
  const innerW = Math.max(0, (w || 600) - padding.left - padding.right)
  const innerH = Math.max(0, height - padding.top - padding.bottom)

  const xInset = 12
  const plotW = Math.max(0, innerW - xInset * 2)

  const allVals = [...points.map(p => p.value), ...futureValues]
  const vMin = Math.min(...(allVals.length ? allVals : [0]))
  const vMax = Math.max(...(allVals.length ? allVals : [100]))
  const pad = (vMax - vMin) * 0.2 || 1
  const yMin = Math.max(0, Math.floor(vMin - pad))
  const yMax = Math.ceil(vMax + pad)
  const y = (v: number) => padding.top + innerH * (1 - (v - yMin) / Math.max(1, yMax - yMin))
  const x = (i: number, total: number) =>
    padding.left + xInset + (total <= 1 ? plotW / 2 : (plotW * i) / (total - 1))
  const solidPath = React.useMemo(() => {
    if (points.length === 0) return ''
    const total = points.length + futureValues.length
    const cmds = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i, total)} ${y(p.value)}`)
    return cmds.join(' ')
  }, [points, futureValues, innerW, innerH])

  const dashedPath = React.useMemo(() => {
    if (points.length < 1 || futureValues.length === 0) return ''
    const total = points.length + futureValues.length
    const startI = points.length - 1
    const segs = [points[points.length - 1].value, ...futureValues].map((v, i) => {
      const xi = x(startI + i, total)
      const yi = y(v)
      return `${i === 0 ? 'M' : 'L'} ${xi} ${yi}`
    })
    return segs.join(' ')
  }, [points, futureValues, innerW, innerH])

  const lastPoint = points[points.length - 1]
  const unit = metric === 'height' ? 'cm' : 'kg'
  const title = metric === 'height' ? '키' : '몸무게'

  const ticks = React.useMemo(() => {
    const n = 5
    const arr = Array.from({ length: n }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / (n - 1)
      return { v: Math.round(v), y: y(v) }
    })
    return arr.reverse()
  }, [yMin, yMax, innerH])

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold">성장이력 그래프</div>
        <div className="flex gap-1">
          <button
            className={
              'h-7 px-3 text-[12px] rounded-md border ' +
              (metric === 'height'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300')
            }
            onClick={() => setMetric('height')}
          >
            키 (cm)
          </button>
          <button
            className={
              'h-7 px-3 text-[12px] rounded-md border ' +
              (metric === 'weight'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300')
            }
            onClick={() => setMetric('weight')}
          >
            몸무게 (kg)
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="h-60 rounded-2xl border border-slate-200 bg-white shadow-sm px-3 py-2"
      >
        {loading ? (
          <div className="h-full grid place-items-center text-sm text-slate-500">불러오는 중…</div>
        ) : error ? (
          <div className="h-full grid place-items-center text-sm text-red-600">{error}</div>
        ) : points.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-slate-500">
            아직 등록된 성장 이력이 없어요.
          </div>
        ) : (
          <svg width="100%" height={height} viewBox={`0 0 ${w || 600} ${height}`}>
            {ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={padding.left}
                  x2={padding.left + innerW}
                  y1={t.y}
                  y2={t.y}
                  stroke="#E5E7EB"
                />
                <text
                  x={padding.left - 14}
                  y={t.y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6B7280"
                >
                  {t.v}
                </text>
              </g>
            ))}

            <path d={solidPath} fill="none" stroke="#0F172A" strokeWidth={2.5} />

            {lastPoint && (
              <circle
                cx={x(points.length - 1, points.length + futureValues.length)}
                cy={y(lastPoint.value)}
                r={5.5}
                fill="#fff"
                stroke="#0F172A"
                strokeWidth={2.5}
              />
            )}

            {dashedPath && (
              <path
                d={dashedPath}
                fill="none"
                stroke="#94A3B8"
                strokeWidth={2.5}
                strokeDasharray="4 4"
              />
            )}

            {points.map((p, i) => (
              <text
                key={i}
                x={x(i, points.length + futureValues.length)}
                y={height - 6}
                fontSize="10"
                fill="#6B7280"
                textAnchor="middle"
              >
                {p.label}
              </text>
            ))}
          </svg>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <span className="inline-block h-[3px] w-6 mx-1 bg-slate-900 rounded" />
          <span>
            실측 {title} ({unit})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-[3px] w-6 mx-1 bg-slate-400 rounded"
            style={{ borderTopStyle: 'dashed', borderTopWidth: 2 }}
          />
          <span>간단 예측</span>
        </div>
      </div>
    </section>
  )
}
