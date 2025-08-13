import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden text-white">
      {/* 배경 색상 + 그라데이션 */}
      <div className="absolute inset-0 bg-[#141b24]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a2230] via-[#141c26] to-[#0f1720] opacity-95" />

      {/* 중앙 텍스트 */}
      <div className="relative z-10 text-center w-full max-w-md px-6 mt-60">
        <h1 className="text-3xl font-bold tracking-wide">
          aiCare
        </h1>
        <p className="mt-2 text-sm text-white/80 font-medium tracking-wide">
          아이 맞춤 성장 로드맵
        </p>
        
        {/* 카카오톡 로고 */}
        <div className="mt-70">
          <img 
            src="/kakao.png" 
            alt="카카오톡 로고" 
            className="w-10 h-10 mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
