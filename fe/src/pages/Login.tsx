export default function Login() {
  return (
    <div className="min-h-screen w-full grid grid-rows-[2fr_1fr] bg-main text-white">
      {/* 타이틀 */}
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">aiCare</h1>
        <p className="mt-2 text-sm text-white/80">아이 맞춤 성장 로드맵</p>
      </div>
      {/* 로그인 버튼 */}
      <div className="flex items-start justify-center">
        <img src="/kakao.png" alt="카카오톡 로고" className="w-10 h-10" />
      </div>
    </div>
  )
}
