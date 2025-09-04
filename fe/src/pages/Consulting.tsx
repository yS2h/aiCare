import React, { useEffect, useRef, useState } from 'react';
import TopBar from '../components/Topbar';
import BottomNav from '../components/BottomNav';
import ChatBubble, { type Side } from '../components/Chatbubble';

type Role = 'system' | 'user' | 'assistant';
type Msg = { id: string; role: Role; side: Side; text: string };

const SYSTEM_PROMPT =
  '당신은 aiCare 상담을 돕는 조수입니다. 한국어로 친절하고 간결하게 답변하세요.';

const INITIAL_MESSAGES: Msg[] = [
  { id: 'sys', role: 'system', side: 'left', text: SYSTEM_PROMPT },
  { id: 'a1', role: 'assistant', side: 'left', text: '안녕하세요 당신의 aiCare 상담사입니다. 무엇을 도와드릴까요?' },
];

const HEADER_H = 64;     // TopBar 높이
const INPUT_H  = 64;     // 입력 영역 높이
const FOOTER_H = 84;     // BottomNav 높이
const SHELL_MAX_W = 720; // 중앙 레일 최대폭

const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

type RawMsg = { role?: string; content?: string } | Record<string, unknown>;

function findLastAssistantInMessagesTree(d: any): string {
  if (!d) return '';
  if (Array.isArray(d?.messages)) {
    const arr = d.messages as RawMsg[];
    for (let i = arr.length - 1; i >= 0; i--) {
      const r = (arr[i] as any)?.role;
      const c = (arr[i] as any)?.content;
      if (r === 'assistant' && typeof c === 'string' && c.trim()) return c.trim();
    }
  }
  if (Array.isArray(d)) {
    for (const it of d) {
      const r = findLastAssistantInMessagesTree(it);
      if (r) return r;
    }
  }
  if (typeof d === 'object') {
    for (const k of Object.keys(d)) {
      const r = findLastAssistantInMessagesTree((d as any)[k]);
      if (r) return r;
    }
  }
  return '';
}

function extractReplyTextDeep(d: any): string {
  if (!d) return '';

  const keys = ['reply', 'assistant', 'answer', 'output', 'result', 'text', 'content', 'message'];
  for (const k of keys) {
    const v = d?.[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object') {
      if (typeof v.content === 'string' && v.content.trim()) return v.content;
      if (typeof v.text === 'string' && v.text.trim()) return v.text;
    }
  }

  if (Array.isArray(d?.choices)) {
    const c0 = d.choices[0];
    const m = c0?.message?.content ?? c0?.delta?.content;
    if (typeof m === 'string' && m.trim()) return m;
  }

  if (Array.isArray(d)) {
    for (const it of d) {
      const r = extractReplyTextDeep(it);
      if (r) return r;
    }
  } else if (typeof d === 'object') {
    for (const k of Object.keys(d)) {
      const r = extractReplyTextDeep(d[k]);
      if (r) return r;
    }
  }
  return '';
}

function extractConversationIdDeep(d: any): string | null {
  if (!d) return null;
  if (typeof d?.conversationId === 'string') return d.conversationId;
  if (typeof d?.id === 'string') return d.id;

  if (Array.isArray(d)) {
    for (const it of d) {
      const cid = extractConversationIdDeep(it);
      if (cid) return cid;
    }
  } else if (typeof d === 'object') {
    for (const k of Object.keys(d)) {
      const cid = extractConversationIdDeep(d[k]);
      if (cid) return cid;
    }
  }
  return null;
}

export default function Consulting() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('consult_cid') : null
  );

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const t = input.trim();
    if (!t || loading) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', side: 'right', text: t };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${base}/gpt/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: t,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 401) throw new Error('로그인이 필요해요. 로그인 후 다시 시도해주세요.');
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data: any = await res.json();

      const cid = extractConversationIdDeep(data) ?? conversationId ?? null;
      if (cid && cid !== conversationId) {
        setConversationId(cid);
        localStorage.setItem('consult_cid', cid);
      }

      let replyText = findLastAssistantInMessagesTree(data);
      if (!replyText) replyText = extractReplyTextDeep(data);

      if (!replyText || replyText.trim() === t) {
        replyText =
          (typeof data?.error === 'string' && data.error) ||
          (typeof data?.message === 'string' && data.message) ||
          '응답을 가져오지 못했어요.';
      }

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', side: 'left', text: replyText },
      ]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          side: 'left',
          text:
            e?.message && typeof e.message === 'string'
              ? e.message
              : '오류가 발생했어요. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const listHeight = `calc(100dvh - ${HEADER_H + INPUT_H + FOOTER_H}px)`;

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="bg-white">
        <div style={{ height: HEADER_H }}>
          <TopBar title="AI 맞춤 상담" variant="light" />
        </div>

        <main
          ref={scrollerRef}
          style={{ height: listHeight }}
          className="overflow-y-auto scroll-smooth"
        >
          <div className="mx-auto px-6 pt-3 pb-6 space-y-3" style={{ maxWidth: SHELL_MAX_W }}>
            {messages
              .filter((m: Msg) => m.role !== 'system')
              .map((m: Msg) => <ChatBubble key={m.id} side={m.side} text={m.text} />)}
          </div>
        </main>

        <div className="bg-white px-6" style={{ height: INPUT_H }}>
          <div className="mx-auto h-full flex items-center gap-2" style={{ maxWidth: SHELL_MAX_W }}>
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
              className="px-4 py-2 rounded-xl bg-main text-white text-sm "
              disabled={loading || !input.trim()}
            >
              전송
            </button>
          </div>
        </div>

        <div className="bg-white" style={{ height: FOOTER_H }}>
          <BottomNav activePage="/consulting" />
        </div>
      </div>
    </div>
  );
}
