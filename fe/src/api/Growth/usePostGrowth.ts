// src/api/Growth/usePostGrowth.ts
import { useMutation } from '@tanstack/react-query'
import api from '../instance'
import dayjs, { Dayjs } from 'dayjs'

export type PostGrowthBody = {
  recorded_at: string // 'YYYY-MM-DD'
  height_cm: number
  weight_kg: number
  bmi?: number | null
  notes?: string | null
}

// 문자열을 number로 안전 변환
function toRequiredNumber(v: string, field: string): number {
  const n = Number(v)
  if (!Number.isFinite(n)) {
    throw new Error(`${field}은(는) 숫자여야 합니다.`)
  }
  return n
}

// 서버 스펙에 맞춘 바디 생성
export function buildPostGrowthBody(args: {
  currentDate: Dayjs
  height: string
  weight: string
  note?: string
}): PostGrowthBody {
  const { currentDate, height, weight, note } = args
  return {
    recorded_at: dayjs(currentDate).format('YYYY-MM-DD'),
    height_cm: toRequiredNumber(height, 'height'),
    weight_kg: toRequiredNumber(weight, 'weight'),
    notes: note && note.trim().length > 0 ? note : null
  }
}

const CHILD_ID = 'b6375014-89cc-4826-95ab-b9ed7f753467'

export default function usePostGrowth() {
  return useMutation({
    mutationFn: async (body: PostGrowthBody) => {
      try {
        const res = await api.post(`/children/${CHILD_ID}/growth`, body)
        return res.data
      } catch (e: any) {
        console.error('❌ PostGrowth 실패')
        console.error('status:', e.response?.status)
        console.error('body:', e.response?.data) // ValidationError 상세 확인
        throw e
      }
    }
  })
}
