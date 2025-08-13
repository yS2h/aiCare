import React, { useState } from 'react';
import { ImageButton } from '../components/Button';

export default function Information() {
  const [formData, setFormData] = useState({
    childName: '',
    childBirth: '',
    childHeight: '',
    childWeight: '',
    fatherHeight: '',
    motherHeight: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('폼 데이터:', formData);
    alert('aiCare 서비스를 시작합니다!');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 style={{ fontSize: '27px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
            aiCare
          </h1>
          <p className="text-xs text-gray-800">서비스 이용을 위한 필수 정보를 입력해 주세요.</p>
        </div>

        {/* 폼 */}
        <form className="space-y-6">
          {/* 아이 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아이 이름
            </label>
            <input
              type="text"
              name="childName"
              value={formData.childName}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="아이 이름을 입력하세요"
            />
          </div>

          {/* 아이 생년월일 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2">
              아이 생년월일
            </label>
            <input
              type="date"
              name="childBirth"
              value={formData.childBirth}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 아이 키와 몸무게 (한 줄에 두 개) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이 키
              </label>
              <input
                type="number"
                name="childHeight"
                value={formData.childHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이 몸무게
              </label>
              <input
                type="number"
                name="childWeight"
                value={formData.childWeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="kg"
              />
            </div>
          </div>

          {/* 아빠 키와 엄마 키 (한 줄에 두 개) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아빠 키
              </label>
              <input
                type="number"
                name="fatherHeight"
                value={formData.fatherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="cm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                엄마 키
              </label>
              <input
                type="number"
                name="motherHeight"
                value={formData.motherHeight}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="cm"
              />
            </div>
          </div>
        </form>
      </div>

      {/* aiCare 시작하기 버튼 - 하단에 고정 */}
      <div className="px-4 pb-6 pt-4">
        <div className="max-w-md mx-auto">
          <ImageButton
            text="aiCare 시작하기"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
