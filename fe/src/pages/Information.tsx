import React, { useState } from 'react'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'

export default function Information() {
  const [formData, setFormData] = useState({
    childName: '',
    childBirth: '',
    childHeight: '',
    childWeight: '',
    fatherHeight: '',
    motherHeight: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const inputStyle = {
    borderColor: '#cdcdcd'
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1
            style={{ fontSize: '27px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
          >
            aiCare
          </h1>
          <p className="text-xs text-gray-800">서비스 이용을 위한 필수 정보를 입력해 주세요.</p>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이 이름</label>
            <input
              type="text"
              name="childName"
              value={formData.childName}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1"
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = '#cdcdcd'
                e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
              }}
              placeholder="아이 이름을 입력하세요"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">아이 생년월일</label>
            <input
              type="date"
              name="childBirth"
              value={formData.childBirth}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1 text-gray-400"
              style={inputStyle}
              onFocus={e => {
                e.target.style.borderColor = '#cdcdcd'
                e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
                e.target.classList.remove('text-gray-400')
                e.target.classList.add('text-gray-900')
              }}
              onBlur={e => {
                if (!e.target.value) {
                  e.target.classList.remove('text-gray-900')
                  e.target.classList.add('text-gray-400')
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이 키</label>
              <input
                type="number"
                name="childHeight"
                value={formData.childHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#cdcdcd'
                  e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
                }}
                placeholder="cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이 몸무게</label>
              <input
                type="number"
                name="childWeight"
                value={formData.childWeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border rounded-md focus:ring-1"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#cdcdcd'
                  e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
                }}
                placeholder="kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아빠 키</label>
              <input
                type="number"
                name="fatherHeight"
                value={formData.fatherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#cdcdcd'
                  e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
                }}
                placeholder="cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">엄마 키</label>
              <input
                type="number"
                name="motherHeight"
                value={formData.motherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1"
                style={inputStyle}
                onFocus={e => {
                  e.target.style.borderColor = '#cdcdcd'
                  e.target.style.setProperty('--tw-ring-color', '#cdcdcd')
                }}
                placeholder="cm"
              />
            </div>
          </div>
        </form>
      </div>

      {/* ✅ 하단 고정 버튼 */}
      <Button label="aiCare 시작하기" withBottomNav={false} />

      <BottomNav showBottomNav={false} />
    </div>
  )
}
