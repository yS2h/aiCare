import React from 'react';

export type Side = 'left' | 'right';

interface ChatBubbleProps {
  side?: Side;       // 'left' = 상대, 'right' = 나
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

  return (
    <div className={`w-full flex ${isRight ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={[
          'relative px-3 py-2 text-sm rounded-2xl max-w-[78%] break-words whitespace-pre-wrap shadow-sm',
          isRight ? 'bg-gray-900 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm',
          // 꼬리
          "after:content-[''] after:absolute after:top-3 after:w-0 after:h-0",
          isRight
            ? 'after:-right-2 after:border-t-transparent after:border-b-transparent after:border-l-gray-900 after:border-l-[10px] after:border-t-[8px] after:border-b-[8px]'
            : 'after:-left-2  after:border-t-transparent after:border-b-transparent after:border-r-gray-100 after:border-r-[10px] after:border-t-[8px] after:border-b-[8px]',
          bubbleClassName,
        ].join(' ')}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
