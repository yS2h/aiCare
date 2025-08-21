import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import api from '@/api/instance'

export default function Information() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    childName: '',
    gender: '',
    childBirth: '',
    childHeight: '',
    childWeight: '',
    fatherHeight: '',
    motherHeight: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toNum = (v: string) => (v.trim() === '' ? null : Number(v))

  // 이미 등록되어 있으면 홈으로
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get('/me/check', { withCredentials: true })
        if (!cancelled && res?.data?.data?.has_child === true) {
          navigate('/home', { replace: true })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.()
    if (loading) return
    setError(null)
    setSuccess(null)

    if (!formData.childName || !formData.gender || !formData.childBirth) {
      setError('아이 이름 / 성별 / 생년월일은 필수입니다.')
      return
    }

    const payload = {
      name: formData.childName,
      gender: formData.gender === '남' ? 'male' : 'female',
      birth_date: formData.childBirth,
      height: toNum(formData.childHeight),
      weight: toNum(formData.childWeight),
      father_height: toNum(formData.fatherHeight),
      mother_height: toNum(formData.motherHeight)
    }

    const confirmChild = async (retries = 6, delayMs = 400) => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await api.get('/me/check', { withCredentials: true })
          if (res?.data?.data?.has_child === true) return true
        } catch {}
        await new Promise(r => setTimeout(r, delayMs))
      }
      return false
    }

    try {
      setLoading(true)
      await api.post('/children', payload, { withCredentials: true })

      const ok = await confirmChild()
      if (ok) {
        navigate('/home', { replace: true })
      } else {
        setSuccess('등록이 완료되었어요. 잠시 후 홈으로 이동해 주세요.')
      }
    } catch (err: any) {
      setSuccess(null)
      setError(err?.response?.data?.message ?? err?.message ?? '요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { borderColor: '#cdcdcd' as const }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="flex-1 max-w-md mx-auto w-full px-6 pt-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 style={{ fontSize: '27px', fontWeight: 'bold', color: 'main', marginBottom: '8px' }}>
            aiCare
          </h1>
          <p className="text-[15px] text-main">서비스 이용을 위한 필수 정보를 입력해 주세요.</p>
        </div>

        <form id="infoForm" onSubmit={handleSubmit} className="space-y-6">
          {/* 아이 이름 + 성별 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">아이 이름</label>
              <input
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border text-[15px] rounded-md focus:outline-none focus:ring-1 text-gray2"
                style={inputStyle}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">성별</label>
              <div
                className="w-full border rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-gray-300"
                style={inputStyle}
                role="group"
                aria-label="성별 선택"
              >
                <div className="grid grid-cols-2">
                  <input
                    type="radio"
                    id="gender-m"
                    name="gender"
                    value="남"
                    checked={formData.gender === '남'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="gender-m"
                    className={
                      'text-[15px] text-center px-3 py-2.5 cursor-pointer select-none ' +
                      (formData.gender === '남' ? 'bg-main text-white' : 'text-main hover:bg-gray4')
                    }
                  >
                    남
                  </label>

                  <input
                    type="radio"
                    id="gender-f"
                    name="gender"
                    value="여"
                    checked={formData.gender === '여'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="gender-f"
                    className={
                      'text-[15px] text-center px-3 py-2.5 cursor-pointer select-none border-l ' +
                      (formData.gender === '여'
                        ? 'bg-main text-white'
                        : 'text-main hover:bg-gray-50')
                    }
                    style={{ borderColor: '#cdcdcd' }}
                  >
                    여
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 아이 생년월일 */}
          <div className="space-y-2">
            <label className="block text-[15px] font-medium text-main">아이 생년월일</label>
            <input
              type="date"
              name="childBirth"
              value={formData.childBirth}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 pt-3 border text-[15px] rounded-md focus:outline-none focus:ring-1 text-gray-400"
              style={inputStyle}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'gray3'
                e.currentTarget.style.setProperty('--tw-ring-color', 'gray3')
                e.currentTarget.classList.remove('text-gray-400')
                e.currentTarget.classList.add('text-gray-900')
              }}
              onBlur={e => {
                if (!e.currentTarget.value) {
                  e.currentTarget.classList.remove('text-gray-900')
                  e.currentTarget.classList.add('text-gray-400')
                }
              }}
            />
          </div>

          {/* 아이 키 + 몸무게 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">아이 키</label>
              <input
                type="number"
                name="childHeight"
                value={formData.childHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border text-[15px] rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                placeholder="cm"
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">아이 몸무게</label>
              <input
                type="number"
                name="childWeight"
                value={formData.childWeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border text-[15px] rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                placeholder="kg"
                step="0.1"
                min="0"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* 부모 키 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">아빠 키</label>
              <input
                type="number"
                name="fatherHeight"
                value={formData.fatherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border text-[15px] rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                placeholder="cm"
                step="0.1"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-main">엄마 키</label>
              <input
                type="number"
                name="motherHeight"
                value={formData.motherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border text-[15px] rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                placeholder="cm"
                step="0.1"
                min="0"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="pt-2 pb-6">
            <Button label="aiCare 시작하기" form="infoForm" type="submit" disabled={loading} />
          </div>
        </form>
      </div>

      <BottomNav showBottomNav={false} />
    </div>
  )
}
