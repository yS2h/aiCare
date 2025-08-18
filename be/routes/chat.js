// routes/chat.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 일반(논-스트리밍) 채팅
 * req.body = { messages: [{role:'system'|'user'|'assistant', content:string}], model?: string, store?: boolean }
 * res = { reply: { role:'assistant', content:string } }
 */
router.post('/', async (req, res) => {
  try {
    const { messages, model = 'gpt-4o-mini', store = true } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages가 필요합니다.' });
    }

    const completion = await openai.chat.completions.create({
      model,
      store,
      messages,
    });

    const reply = completion.choices?.[0]?.message || { role: 'assistant', content: '' };
    return res.json({ reply });
  } catch (err) {
    console.error('[CHAT]', err);
    return res.status(500).json({ error: err.message || 'OpenAI error' });
  }
});

/**
 * 스트리밍(SSE) 채팅
 * req.body = { messages: [...], model?: string }
 * 응답은 SSE로 data: {delta} 를 계속 보냄
 */
router.post('/stream', async (req, res) => {
  // SSE 헤더
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  req.socket.setTimeout(0);

  try {
    const { messages, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'messages가 필요합니다.' })}\n\n`);
      return res.end();
    }

    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    for await (const part of stream) {
      const delta = part.choices?.[0]?.delta?.content || '';
      if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[CHAT/STREAM]', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'OpenAI error' })}\n\n`);
    res.end();
  }
});

module.exports = router;
