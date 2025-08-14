import React from 'react'

interface ImageButtonProps {
  text: string
  onClick?: () => void
  className?: string
}

export const ImageButton: React.FC<ImageButtonProps> = ({ text, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-4 px-6
        text-white
        font-bold text-lg
        border rounded-md
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${className}
      `}
      style={
        {
          backgroundColor: 'var(--color-main)',
          borderColor: 'var(--color-main)',
          '--tw-ring-color': 'var(--color-main)'
        } as React.CSSProperties
      }
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-grey1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'var(--color-main)'
      }}
      type="button"
    >
      {text}
    </button>
  )
}

export default ImageButton
