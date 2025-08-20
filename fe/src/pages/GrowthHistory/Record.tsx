import { useEffect, useMemo, useState } from 'react'
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

type GrowthListResponse = { success: true; data: GrowthRecord[] }

export default function Record() {
  const [raw, setRaw] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchList = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get<GrowthListResponse>('/growth')
      setRaw(res.data?.data ?? [])
      setPage(1)
    } catch (e: any) {
      console.error('[GET /growth error]', e?.response?.status, e?.response?.data, e?.message)
      setError(
        e?.response?.data?.message ??
        e?.message ??
        '성장 이력을 불러오지 못했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const rows = useMemo(() => {
    return (raw ?? []).map((r) => {
      const d = dayjs(r.recorded_at)
      return {
        id: r.id,
        dateLabel: d.isValid() ? d.format('YYYY.MM.DD') : '-',
        height: typeof r.height_cm === 'number' ? r.height_cm : '-',
        weight: typeof r.weight_kg === 'number' ? r.weight_kg : '-',
        bmi: typeof r.bmi === 'number' ? r.bmi : '-',
        note: r.notes ?? '',
      }
    })
  }, [raw])

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)

  const thClass =
    'px-3 py-3 text-[13px] font-semibold text-slate-700 text-center'
  const tdClass = 'px-3 py-2 text-[13px] text-slate-800 text-center'

  return (
    <div className="space-y-3">
      <div className="text-[15px] font-semibold">등록 정보 이력</div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[640px] w-full table-fixed">
            <colgroup>
              <col className="w-[128px]" />  {/* 날짜 */}
              <col className="w-[70px]" />   {/* 키 */}
              <col className="w-[90px]" />   {/* 몸무게 */}
              <col className="w-[70px]" />   {/* BMI */}
              <col className="w-[200px]" />  {/* 특이사항 */}
            </colgroup>

            <thead className="bg-slate-50">
              <tr>
                <th className={thClass}>날짜</th>
                <th className={thClass}>키(CM)</th>
                <th className={thClass}>몸무게(KG)</th>
                <th className={thClass}>BMI</th>
                <th className={thClass}>특이사항</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className={tdClass}>
                      <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className={tdClass}>
                      <div className="h-3.5 w-10 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className={tdClass}>
                      <div className="h-3.5 w-12 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className={tdClass}>
                      <div className="h-3.5 w-8 animate-pulse rounded bg-slate-200" />
                    </td>
                    <td className="px-3 py-2 text-[13px] text-slate-800 text-left">
                      <div className="h-3.5 w-40 animate-pulse rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : pageRows.length > 0 ? (
                pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className={tdClass}>{r.dateLabel}</td>
                    <td className={tdClass}>{r.height}</td>
                    <td className={tdClass}>{r.weight}</td>
                    <td className={tdClass}>{r.bmi}</td>

                    <td className="px-3 py-2 text-[13px] text-slate-600 whitespace-normal break-words text-left">
                      {r.note || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500 text-center" colSpan={5}>
                    {error ? (
                      <span className="text-red-600">Internal Server Error</span>
                    ) : (
                      '아직 등록된 성장 이력이 없어요.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-4 py-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(+e.target.value)
                setPage(1)
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>

            <button
              className="h-8 w-8 rounded-md border border-slate-300 text-sm disabled:opacity-40"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="첫 페이지"
            >
              ⟪
            </button>
            <button
              className="h-8 w-8 rounded-md border border-slate-300 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="이전"
            >
              ‹
            </button>
            <span className="px-2 text-xs text-slate-600">
              Page {page} / {Math.max(1, totalPages)}
            </span>
            <button
              className="h-8 w-8 rounded-md border border-slate-300 text-sm disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="다음"
            >
              ›
            </button>
            <button
              className="h-8 w-8 rounded-md border border-slate-300 text-sm disabled:opacity-40"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label="마지막 페이지"
            >
              ⟫
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
