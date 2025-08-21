import TopBar from '@/components/Topbar'
import { useAuth } from '@/api/auth/AuthContext'
import BottomNav from '@/components/BottomNav'
import api from '@/api/instance'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Me = {
  id?: string
  name?: string
  email?: string
  avatarUrl?: string
}

export default function MyPage() {
  const { loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()

  const [me, setMe] = useState<Me | null>(null)
  const [meLoading, setMeLoading] = useState(false)
  const [meError, setMeError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setMeLoading(true)
        setMeError(null)
        const res = await api.get('/auth/me')
        console.log('[auth/me 응답]', res.data)
        if (!alive) return
        setMe(res.data?.user ?? null)
      } catch (e: any) {
        if (!alive) return
        setMeError('프로필 정보를 불러오지 못했습니다.')
      } finally {
        if (!alive) return
        setMeLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const displayName = useMemo(() => me?.name || '사용자', [me])
  const avatarUrl: string | undefined = useMemo(() => me?.avatarUrl, [me])

  // ✅ 환영 문구
  const greeting = useMemo(
    () => (me?.name ? `${me.name}님` : '환영합니다!'),
    [me?.name]
  )

  const [imgOk, setImgOk] = useState(true)
  useEffect(() => { setImgOk(true) }, [avatarUrl])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-main text-white flex items-center justify-center">
        <span className="text-sm text-white/70">로딩 중…</span>
      </div>
    )
  }

  const NAV_HEIGHT_PX = 72

  const Item = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-[15px] text-slate-900 active:bg-slate-50"
    >
      <span>{label}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" className="text-slate-400">
        <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  )

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6">
      <div className="px-4 py-3 text-[13px] font-semibold text-slate-900">{title}</div>
      <div className="border-t border-slate-200" />
    </div>
  )

  return (
    <div className="relative min-h-screen">
      {/* 배경 */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-x-0 top-0 h-[33vh] bg-main" />

      <div className="relative z-10 min-h-screen grid grid-rows-[auto_1fr_auto]">
        <TopBar title="마이페이지" variant="dark" />

        <main
          className="overflow-y-auto px-6 pb-4 text-slate-900"
          style={{ paddingBottom: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom) + 48px)` }}
        >
          {/* 프로필 영역 */}
          <section className="flex flex-col items-center justify-start text-white pt-10 px-6" style={{ height: '28vh' }}>
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {avatarUrl && imgOk ? (
                <img
                  src={avatarUrl}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                  onError={() => setImgOk(false)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-slate-600 text-xl font-semibold select-none">
                    {displayName?.slice(0, 1) || '유'}
                  </span>
                </div>
              )}
            </div>

            {/* ✅ 여기서 환영 문구 출력 */}
            <p className="mt-7 text-base font-semibold text-center truncate max-w-full">
              {greeting}
            </p>

            {meLoading && <span className="mt-2 text-xs text-white/70">프로필 불러오는 중…</span>}
            {meError && <span className="mt-2 text-xs text-red-200">{meError}</span>}
          </section>

          {/* 리스트 섹션 */}
          <section className="-mt-8">
            <SectionHeader title="계정" />
            <div className="divide-y divide-slate-200">
              <Item label="회원 정보 변경" onClick={() => navigate('/account/edit')} />
              <Item label="비밀번호 변경" onClick={() => navigate('/account/password')} />
            </div>

            <SectionHeader title="아이 정보" />
            <div className="divide-y divide-slate-200">
              <Item label="아이 정보 변경" onClick={() => navigate('/information')} />
              <Item label="아이 추가하기" onClick={() => navigate('/children/new')} />
            </div>

            <SectionHeader title="고객지원" />
            <div className="divide-y divide-slate-200">
              <Item label="공지사항" onClick={() => navigate('/notices')} />
              <Item label="FAQ" onClick={() => navigate('/faq')} />
            </div>
          </section>
        </main>

        <div
          className="fixed inset-x-4 z-50 flex justify-center"
          style={{ bottom: `calc(${NAV_HEIGHT_PX}px + env(safe-area-inset-bottom) + 24px)` }}
        >
          <button
            onClick={logout}
            className="relative left-2 text-xs text-gray1 hover:text-black underline"
            aria-label="로그아웃"
          >
            로그아웃
          </button>
        </div>

        <BottomNav activePage="/" />
      </div>
    </div>
  )
}
