import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
}

export default function Button({
  label,
  disabled,
  className,
  style,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <div className="w-full flex justify-center">
      <button
        type={type}
        disabled={disabled}
        style={{
          backgroundColor: 'var(--color-main)',
          color: 'white',
          fontSize: '15px',
          fontWeight: 500,
          padding: '12px 24px',
          border: 'none',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '600px',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style
        }}
        className={className}
        {...rest}
      >
        {label}
      </button>
    </div>
  )
}
