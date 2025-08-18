const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { upsertChild } = require("../services/childrenService");

const bodySchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  father_height: z.coerce.number().positive(),
  mother_height: z.coerce.number().positive(),
});

const router = Router();

defineRoute(router, {
  method: "post",
  path: "/",
  summary: "아이 정보 등록/수정",
  tags: ["Children"],
  request: {
    body: { content: { "application/json": { schema: bodySchema } } },
  },
  responses: { 200: { description: "ok" } },
  handler: async (ctx, req, res, next) => {
    try {
      const saved = await upsertChild(req.user.id, ctx.body);
      return res.json(success(saved, "saved"));
    } catch (err) {
      if (err?.code === "22P02")
        return next(new ApiError(400, "user_id must be UUID"));
      if (err?.code === "23503")
        return next(new ApiError(404, "User not found"));
      if (err?.code === "23514")
        return next(new ApiError(400, "Check constraint failed"));
      if (err?.code === "42P01")
        return next(new ApiError(500, "Table 'children' not found"));
      return next(err);
    }
  },
});

module.exports = router;
