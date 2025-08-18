// src/components/Button.tsx
import React from 'react'

interface ButtonProps {
  label: string
  withBottomNav?: boolean // 기본 true
}

const Button: React.FC<ButtonProps> = ({ label, withBottomNav = true }) => {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-full max-w-[600px] px-6"
      style={{
        bottom: withBottomNav
          ? 'calc(var(--bottom-nav-h, 72px) + var(--button-gap, 24px) + env(safe-area-inset-bottom))'
          : 'calc(24px + env(safe-area-inset-bottom))'
      }}
    >
      <button
        style={{
          backgroundColor: 'var(--color-main)',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 500,
          padding: '12px 24px',
          border: 'none',
          borderRadius: '10px',
          width: '100%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 18px rgba(0,0,0,0.06)'
        }}
      >
        {label}
      </button>
    </div>
  )
}

export default Button
