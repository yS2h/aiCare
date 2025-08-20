import api from '../instance'

export type GrowthRecordUpsertBody = {
  recorded_at: string
  height_cm: number
  weight_kg: number
  bmi?: number | null
  notes?: string | null
}

export type GrowthRecord = {
  id: string
  child_id: string
  recorded_at: string
  height_cm: number
  weight_kg: number
  bmi: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

export async function upsertGrowth(body: GrowthRecordUpsertBody): Promise<GrowthRecord> {
  const res = await api.post<ApiSuccess<GrowthRecord>>('/growth', body)
  return res.data.data
}
