const { Router } = require("express");
const { z } = require("zod");
const jwt = require("jsonwebtoken");

const { defineRoute } = require("../lib/route");
const { requireAuth } = require("../middlewares/auth");
const { success } = require("../utils/response");
const { upsertChild } = require("../services/childrenService");

const bodySchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  father_height: z.coerce.number().positive(),
  mother_height: z.coerce.number().positive(),
});

const router = Router();

defineRoute(router, {
  method: "post",
  path: "/",
  docPath: "/children",
  summary: "내 아이 정보 등록(없으면 생성, 있으면 업데이트)",
  tags: ["Children"],
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: bodySchema } } },
  },
  responses: {
    200: { description: "저장 성공" },
    400: { description: "검증 실패" },
    401: { description: "인증 실패" },
  },
  handler: async (ctx, req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });

    const { sub: userId } = jwt.verify(token, process.env.JWT_SECRET);

    const saved = await upsertChild(userId, ctx.body);
    return success(saved, "saved");
  },
});

module.exports = router;
