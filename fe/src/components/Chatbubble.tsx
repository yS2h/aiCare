import React from 'react';

export type Side = 'left' | 'right';

interface ChatBubbleProps {
  side?: Side;
  text: string;
  className?: string;
  bubbleClassName?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  side = 'left',
  text,
  className = '',
  bubbleClassName = '',
}) => {
  const isRight = side === 'right';
  const bubbleColor = isRight ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  const tailColor   = isRight ? 'bg-gray-900' : 'bg-gray-100';

  return (
    <div className={`w-full flex ${isRight ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={[
          'relative max-w-[76%]',          
          'px-3 py-2',                      
          'text-[15px] leading-5',          
          'rounded-xl',                     
          'break-words whitespace-pre-wrap',
          'shadow-none',                    
          bubbleColor,
          bubbleClassName,
        ].join(' ')}
      >
        {text}

        <span
          className={[
            'absolute block rotate-45 rounded-[2px]',
            'w-2.5 h-2.5',                   
            tailColor,
            isRight ? 'right-[-5px]' : 'left-[-5px]',
            'top-1/2 -translate-y-1/2',
          ].join(' ')}
        />
      </div>
    </div>
  );
};

export default ChatBubble;
