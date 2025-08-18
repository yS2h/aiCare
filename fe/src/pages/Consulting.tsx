// src/pages/Consulting.tsx
import React, { useEffect, useRef, useState } from 'react';
import TopBar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import ChatBubble, { type Side } from '../components/Chatbubble';

type Role = 'system' | 'user' | 'assistant';
type Msg = { id: string; role: Role; side: Side; text: string };

const SYSTEM_PROMPT =
  '당신은 aiCare 상담을 돕는 조수입니다. 한국어로 친절하고 간결하게 답변하세요.';

// 말풍선에 안 보이는 시스템 메시지는 state에는 넣되 렌더링에서 제외
const INITIAL_MESSAGES: Msg[] = [
  { id: 'sys', role: 'system', side: 'left', text: SYSTEM_PROMPT },
  { id: 'a1', role: 'assistant', side: 'left', text: '안녕하세요! 무엇을 도와드릴까요?' },
];

export default function Consulting() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // 새 메시지 들어올 때 하단으로 스크롤
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    const t = input.trim();
    if (!t || loading) return;

    // 1) 내 메시지 바로 표시
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', side: 'right', text: t };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2) 서버로 보내는 payload는 role/content만 필요
      const payload = {
        store: true,
        messages: messages
          .concat(userMsg)
          .map(m => ({ role: m.role, content: m.text })),
      };

      const base = import.meta.env.VITE_API_BASE_URL ?? '';
      const res = await fetch(`${base}/api/consult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Chat API error');
      }

      const data = await res.json();
      const content = data?.reply?.content ?? '';

      // 3) 어시스턴트 답변 렌더
      const assistantMsg: Msg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        side: 'left',
        text: typeof content === 'string' ? content : JSON.stringify(content),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          side: 'left',
          text: '오류가 발생했어요. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enter 전송(Shift+Enter는 줄바꿈)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar title="AI 맞춤 상담" variant="light" />

      {/* 메시지 리스트 */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 pt-3 pb-24 space-y-3"
      >
        {messages
          .filter(m => m.role !== 'system') // 시스템 메시지는 화면에 숨김
          .map(m => (
            <ChatBubble key={m.id} side={m.side} text={m.text} />
          ))}
      </div>

      {/* 입력 영역 (BottomNav랑 겹치지 않게 패딩) */}
      <div className="px-4 pb-20 pt-2 bg-white/80 backdrop-blur sticky bottom-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={loading ? '응답 생성 중…' : '메시지를 입력하세요'}
            disabled={loading}
            className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1"
            style={{ borderColor: '#e5e7eb' }}
          />
          <button
            onClick={send}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm disabled:opacity-50"
            disabled={loading || !input.trim()}
          >
            전송
          </button>
        </div>
      </div>

      <BottomNav activePage="/consulting" />
    </div>
  );
}
