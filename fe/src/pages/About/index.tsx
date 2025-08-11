import { useState } from 'react'
import { api } from '@/lib/apiClient'

type Health = {
  status: string
  service: string
  time: string
}

type VersionData = {
  version: string
  name: string
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  try {
    return JSON.stringify(e)
  } catch {
    return 'Unknown error'
  }
}

export default function TestApi() {
  const [health, setHealth] = useState<Health | null>(null)
  const [version, setVersion] = useState<VersionData | null>(null)
  const [err, setErr] = useState('')

  const testHealth = async () => {
    setErr('')
    try {
      const data = await api.get<Health>('/api/health') // body 그대로
      setHealth(data)
    } catch (e: unknown) {
      setErr(getErrorMessage(e))
    }
  }

  const testVersion = async () => {
    setErr('')
    try {
      const data = await api.get<VersionData>('/api/version') // data만
      setVersion(data)
    } catch (e: unknown) {
      setErr(getErrorMessage(e))
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <button onClick={testHealth} className="bg-blue-500 text-white px-3 py-2 rounded">
          /api/health
        </button>
        <button onClick={testVersion} className="bg-green-600 text-white px-3 py-2 rounded">
          /api/version
        </button>
      </div>

      {err && <div className="text-red-600">에러: {err}</div>}

      {health && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(health, null, 2)}</pre>}
      {version && <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(version, null, 2)}</pre>}
    </div>
  )
}
