import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function TestApi() {
  const [data, setData] = useState(null)

  const handleTest = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('API 요청 실패', err)
    }
  }

  return (
    <div className="p-4">
      <button onClick={handleTest} className="bg-blue-500 text-white px-4 py-2 rounded">
        API 테스트
      </button>
      {data && <pre className="mt-4 bg-gray-100 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
