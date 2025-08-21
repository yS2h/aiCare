const { Router } = require("express");
const { z } = require("zod");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { UnauthorizedError } = require("../utils/ApiError");
const {
  chatAndStore,
  listMessages,
  ensureConversationOwned,
  listMyConversations,
} = require("../services/chatService");

extendZodWithOpenApi(z);
const router = Router();

const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  model: z.string().nullable().optional(),
  finish_reason: z.string().nullable().optional(),
  usage: z.any().nullable().optional(),
  created_at: z.string(),
});

const ConversationSchema = z.object({ id: z.string().uuid() });

const ConversationWithMessagesSchema = z.object({
  conversation: ConversationSchema,
  messages: z.array(MessageSchema),
});

defineRoute(router, {
  method: "post",
  path: "/gpt/chat",
  docPath: "/api/gpt/chat",
  summary: "메시지 전송(새 대화 생성 또는 기존에 이어쓰기)",
  tags: ["GPT"],
  request: {
    body: z
      .object({
        chat_id: z.string().uuid().optional(),
        message: z.string().min(1),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
      })
      .openapi("ChatSendBody", {
        example: { message: "안녕!", temperature: 0.2 },
      }),
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: ConversationWithMessagesSchema,
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "conversation not found" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { chat_id, message, model, temperature } = ctx.body;
    const data = await chatAndStore({
      chatId: chat_id,
      userId,
      userMessage: message,
      model,
      temperature,
      tailForPrompt: 20,
      limitForReturn: 200,
    });

    return success(res, data);
  },
});

defineRoute(router, {
  method: "get",
  path: "/gpt/messages",
  docPath: "/api/gpt/messages",
  summary: "특정 대화 메시지 조회",
  tags: ["GPT"],
  request: {
    query: z
      .object({
        chat_id: z.string().uuid(),
        limit: z
          .string()
          .regex(/^\d+$/)
          .transform((v) => parseInt(v, 10))
          .optional()
          .openapi({ example: "200" }),
      })
      .openapi("ChatListQuery"),
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: ConversationWithMessagesSchema,
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "conversation not found" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { chat_id, limit } = ctx.query;
    const conv = await ensureConversationOwned({
      conversationId: chat_id,
      userId,
    });
    const rows = await listMessages({
      conversationId: conv.id,
      limit: limit ?? 200,
    });
    return success(res, { conversation: { id: conv.id }, messages: rows });
  },
});

defineRoute(router, {
  method: "get",
  path: "/gpt/conversations",
  docPath: "/api/gpt/conversations",
  summary: "내 대화 목록",
  tags: ["GPT"],
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                id: z.string().uuid(),
                created_at: z.string(),
                updated_at: z.string(),
                last_role: z
                  .enum(["system", "user", "assistant"])
                  .nullable()
                  .optional(),
                last_content: z.string().nullable().optional(),
                last_created_at: z.string().nullable().optional(),
              })
            ),
          }),
        },
      },
    },
    401: { description: "unauthorized" },
  },
  handler: async (_ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
    const rows = await listMyConversations({ userId, limit: 50 });
    return success(res, rows);
  },
});

module.exports = router;
