import React from 'react'

interface ButtonProps {
  label: string
}

const Button: React.FC<ButtonProps> = ({ label }) => {
  return (
    <div className="w-full flex justify-center ">
      <button
        style={{
          backgroundColor: 'var(--color-main)',
          color: 'white',
          fontSize: '15px',
          fontWeight: 500,
          padding: '12px 24px',
          border: 'none',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '600px'
        }}
      >
        {label}
      </button>
    </div>
  )
}

export default Button
