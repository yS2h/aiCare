import React from 'react';

// 이미지에 보이는 버튼과 정확히 일치하는 디자인의 재사용 가능한 버튼
interface ImageButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

export const ImageButton: React.FC<ImageButtonProps> = ({ 
  text, 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-4 px-6
        !bg-gray-800 hover:!bg-gray-700
        !text-white !opacity-100
        font-bold text-lg
        border border-gray-300 rounded-md
        transition-all duration-200
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${className}
      `}
      type="button"
    >
      {text}
    </button>
  );
};

export default ImageButton;