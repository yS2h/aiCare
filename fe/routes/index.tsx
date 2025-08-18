import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function AppRoutes() {
  return (
    <Routes>
      {/* 게스트 전용 */}
      <Route element={<ProtectedRoute mode="guest" />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* 로그인 필요 */}
      <Route element={<ProtectedRoute mode="auth" />}>
        <Route path="/" element={<Home />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/growth-history" element={<GrowthHistory />} />
        <Route path="/information" element={<Information />} />
        <Route path="/bone-age" element={<BoneAge />} />
        <Route path="/spine" element={<Spine />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/consulting" element={<Consulting />} />
      </Route>

      {/* 알 수 없는 경로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
