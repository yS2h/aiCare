import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MyPage from './pages/MyPage'
import Login from './pages/Login'
import GrowthHistory from './pages/GrowthHistory'
import BoneAge from './pages/BoneAge'
import Spine from './pages/Spine'
import Guide from './pages/Guide'
import Consulting from './pages/Consulting'
import Information from './pages/information'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/growth-history" element={<GrowthHistory />} />
      <Route path="/information" element={<Information />} />
      <Route path="/bone-age" element={<BoneAge />} />
      <Route path="/spine" element={<Spine />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/consulting" element={<Consulting />} />
    </Routes>
  )
}

export default App