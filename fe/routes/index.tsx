import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import api from '@/api/instance'
import Home from '@/pages/Home'
import MyPage from '@/pages/MyPage'
import Login from '@/pages/Login'
import GrowthHistory from '@/pages/GrowthHistory/GrowthHistory'
import BoneAge from '@/pages/BoneAge'
import Spine from '@/pages/Spine'
import Guide from '@/pages/Guide'
import Consulting from '@/pages/Consulting'
import Information from '@/pages/Information'
import ProtectedRoute from './ProtectedRoute'

function Gate() {
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await api.get('/auth/me', { withCredentials: true })
        const res = await api.get('/me/check', { withCredentials: true })
        if (cancelled) return
        const hasChild = res?.data?.data?.has_child === true
        navigate(hasChild ? '/home' : '/information', { replace: true })
      } catch {
        if (!cancelled) navigate('/login', { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-sm text-gray-500">초기화 중…</span>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* 최초 진입 분기 */}
      <Route path="/" element={<Gate />} />

      {/* 게스트 전용: 로그인 페이지 */}
      <Route element={<ProtectedRoute mode="guest" />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* 로그인만 필요: 자녀 미등록 사용자도 접근 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/information" element={<Information />} />
      </Route>

      {/* 로그인 + 자녀 등록 필요 */}
      <Route element={<ProtectedRoute requireChild />}>
        <Route path="/home" element={<Home />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/growth-history" element={<GrowthHistory />} />
        <Route path="/bone-age" element={<BoneAge />} />
        <Route path="/spine" element={<Spine />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/consulting" element={<Consulting />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
