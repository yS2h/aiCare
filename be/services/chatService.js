const { query } = require("../providers/db");
const { v4: uuidv4 } = require("uuid");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/ApiError");
const { chat } = require("./openaiService");
const {
  buildGrowthCoachSystemMessage,
  OPENING_LINE,
} = require("../prompts/growthCoachPrompt");

async function getConversationOwned({ conversationId, userId }) {
  const { rows } = await query(
    `SELECT id, user_id, created_at, updated_at
       FROM conversations
      WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  return rows[0] || null;
}

async function ensureConversationOwned({ conversationId, userId }) {
  if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
  if (!conversationId) throw new BadRequestError("chat_id가 없습니다.");
  const conv = await getConversationOwned({ conversationId, userId });
  if (!conv) throw new NotFoundError("대화를 찾을 수 없습니다.");
  return conv;
}

async function createConversation({ userId }) {
  if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
  const id = uuidv4();
  const { rows } = await query(
    `INSERT INTO conversations (id, user_id)
     VALUES ($1, $2)
     RETURNING id, user_id, created_at, updated_at`,
    [id, userId]
  );
  return rows[0];
}

async function appendMessage({ conversationId, role, content, meta = {} }) {
  const id = uuidv4();
  const { rows } = await query(
    `WITH ins AS (
       INSERT INTO messages (id, conversation_id, role, content, model, finish_reason, usage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, conversation_id, role, content, model, finish_reason, usage, created_at
     )
     UPDATE conversations
        SET updated_at = now()
      WHERE id = $2
      RETURNING (SELECT row_to_json(ins) FROM ins) AS msg`,
    [
      id,
      conversationId,
      role,
      content,
      meta.model ?? null,
      meta.finish_reason ?? null,
      meta.usage ? JSON.stringify(meta.usage) : null,
    ]
  );
  return rows[0]?.msg;
}

async function listMessages({ conversationId, limit = 200 }) {
  const { rows } = await query(
    `SELECT id, role, content, model, finish_reason, usage, created_at
       FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2`,
    [conversationId, Math.max(1, Math.min(500, limit))]
  );
  return rows;
}

function toOpenAIMessages(rows, tail = 20) {
  const s = rows.slice(-tail);
  return s.map((m) => ({ role: m.role, content: m.content }));
}

async function listMyConversations({ userId, limit = 50 }) {
  if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
  const { rows } = await query(
    `
    SELECT c.id, c.created_at, c.updated_at,
           m.role AS last_role, m.content AS last_content, m.created_at AS last_created_at
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT role, content, created_at
          FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
      ) m ON true
     WHERE c.user_id = $1
     ORDER BY c.updated_at DESC
     LIMIT $2
    `,
    [userId, Math.max(1, Math.min(200, limit))]
  );
  return rows;
}

async function chatAndStore({
  chatId, // conversation id (optional)
  userId,
  userMessage,
  model,
  temperature = 0.2,
  tailForPrompt = 20,
  limitForReturn = 200,
}) {
  if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
  if (!userMessage || !userMessage.trim())
    throw new BadRequestError("message가 비어있습니다.");

  const conv = chatId
    ? await ensureConversationOwned({ conversationId: chatId, userId })
    : await createConversation({ userId });

  await appendMessage({
    conversationId: conv.id,
    role: "user",
    content: userMessage,
  });

  const history = await listMessages({ conversationId: conv.id, limit: 1000 });
  const recent = toOpenAIMessages(history, tailForPrompt);

  const systemMsg = {
    role: "system",
    content: buildGrowthCoachSystemMessage({ locale: "ko" }),
  };
  const messages = [systemMsg, ...recent];

  const hadAssistantBefore = history.some((m) => m.role === "assistant");

  const result = await chat({ messages, model, temperature });

  const assistantText =
    typeof result.message?.content === "string"
      ? result.message.content
      : Array.isArray(result.message?.content)
        ? result.message.content
            .map((c) => (typeof c === "string" ? c : c.text || ""))
            .join("\n")
        : "";

  const needsOpening =
    !hadAssistantBefore &&
    typeof assistantText === "string" &&
    !assistantText.trimStart().startsWith(OPENING_LINE);

  const finalText = needsOpening
    ? `${OPENING_LINE}\n\n${assistantText}`
    : assistantText;

  await appendMessage({
    conversationId: conv.id,
    role: "assistant",
    content: finalText,
    meta: {
      model: result.model,
      finish_reason: result.finish_reason,
      usage: result.usage,
    },
  });

  const all = await listMessages({
    conversationId: conv.id,
    limit: limitForReturn,
  });
  return { conversation: { id: conv.id }, messages: all };
}

module.exports = {
  chatAndStore,
  listMessages,
  ensureConversationOwned,
  listMyConversations,
};
