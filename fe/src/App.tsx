import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import MyPage from './pages/MyPage'
import Login from './pages/Login'
import GrowthHistory from './pages/GrowthHistory'
import BoneAge from './pages/BoneAge'
import Spine from './pages/Spine'
import Guide from './pages/Guide'
import Consulting from './pages/Consulting'
import Information from './pages/Information'
import BottomNav from './components/BottomNav'

function AppContent() {
  const location = useLocation()

  // information과 Login 페이지에서는 BottomNav 숨기기
  const shouldShowBottomNav = !['/information', '/login'].includes(location.pathname)

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/growth-history" element={<GrowthHistory />} />
        <Route path="/bone-age" element={<BoneAge />} />
        <Route path="/spine" element={<Spine />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/consulting" element={<Consulting />} />
        <Route path="/information" element={<Information />} />
      </Routes>
      {shouldShowBottomNav && <BottomNav />}
    </>
  )
}

function App() {
  return <AppContent />
}

export default App
