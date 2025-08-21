const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const OpenAI = require("openai");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");

extendZodWithOpenApi(z);
const router = Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
});

const BodySchema = z
  .object({
    message: z.string().min(1).optional().openapi({ example: "hello" }),
    store: z.boolean().optional().openapi({ example: true }),
    model: z.string().optional().openapi({ example: "gpt-4o-mini" }),
    temperature: z.number().min(0).max(2).optional().openapi({ example: 0.2 }),
  })
  .openapi("GptPingPublicBody");

const RespSchema = z
  .object({
    model: z.string(),
    content: z.string().nullable(),
    finish_reason: z.string().nullable().optional(),
    usage: z
      .object({
        prompt_tokens: z.number().optional(),
        completion_tokens: z.number().optional(),
        total_tokens: z.number().optional(),
      })
      .optional(),
  })
  .openapi("GptPingPublicResp");

defineRoute(router, {
  method: "post",
  path: "/gpt/ping",
  docPath: "/api/gpt/ping",
  summary: "GPT 연결 체크",
  tags: ["GPT"],
  request: { body: BodySchema },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({ success: z.literal(true), data: RespSchema }),
        },
      },
    },
  },
  handler: async (ctx, _req, res) => {
    const {
      message = "hello",
      model = process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature = 0.2,
      store,
    } = ctx.body || {};

    const payload = {
      model,
      messages: [{ role: "user", content: message }],
      temperature,
    };
    if (typeof store === "boolean") payload.store = store;

    let resp;
    try {
      resp = await client.chat.completions.create(payload);
    } catch (e) {
      if (payload.store !== undefined) {
        delete payload.store;
        resp = await client.chat.completions.create(payload);
      } else {
        throw e;
      }
    }

    const choice = resp.choices?.[0];
    return success(res, {
      model: resp.model,
      content: choice?.message?.content ?? null,
      finish_reason: choice?.finish_reason ?? null,
      usage: resp.usage,
    });
  },
});

module.exports = router;
