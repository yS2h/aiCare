const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

// 백엔드 표준 응답 형태 (성공)
export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

// 백엔드 표준 에러 형태 (참고용)
export type ApiError = {
  success: false
  message: string
  code?: number
  details?: unknown
}

type RequestOptions = RequestInit & {
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : null

  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) || `Request failed: ${res.status} ${res.statusText}`
    throw new Error(msg)
  }

  if (body && typeof body === 'object' && 'success' in body) {
    if ((body as ApiSuccess<T>).success) {
      return ((body as ApiSuccess<T>).data ?? null) as T
    }
    throw new Error((body as ApiError).message || 'Unknown API error')
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
}
