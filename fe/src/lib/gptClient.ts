// src/lib/gptClient.ts
export type Role = 'system' | 'user' | 'assistant';
export type ChatMessage = { role: Role; content: string };

const base = import.meta.env.VITE_API_BASE_URL ?? '';

function normReply(data: any): ChatMessage {
  // 서버 응답 스키마가 약간 달라도 안전하게 뽑아오기
  return (
    data?.reply ??
    data?.message ??
    data?.choices?.[0]?.message ?? { role: 'assistant', content: '' }
  );
}

export async function chatAPI(params: {
  conversationId?: string;
  messages: ChatMessage[];
}) {
  const res = await fetch(`${base}/api/gpt/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'chat error'));
  const data = await res.json();
  return {
    conversationId: data?.conversationId ?? params.conversationId ?? '',
    reply: normReply(data),
    raw: data,
  };
}

export async function fetchMessages(conversationId: string) {
  const url = `${base}/api/gpt/messages?conversationId=${encodeURIComponent(conversationId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text().catch(() => 'messages error'));
  const data = await res.json();
  // [{role, content}] 형태로 정규화
  const list: ChatMessage[] = data?.messages ?? data ?? [];
  return list;
}

export async function fetchConversations() {
  const res = await fetch(`${base}/api/gpt/conversations`);
  if (!res.ok) throw new Error(await res.text().catch(() => 'conversations error'));
  return res.json(); // 스키마는 화면에서 자유롭게 사용
}
