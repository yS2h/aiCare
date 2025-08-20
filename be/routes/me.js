const { Router } = require("express");
const { requireAuth } = require("../middlewares/requireAuth");
const { success } = require("../utils/response");

const { defineRoute } = require("../lib/route");
const { z } = require("zod");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");
const { UnauthorizedError } = require("../utils/ApiError");
const { getChildStatus } = require("../services/childrenService");
extendZodWithOpenApi(z);

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json(success({ me: req.user }));
});

const ChildStatusZ = z
  .object({
    has_child: z.boolean().openapi({ example: true }),
    child_id: z.string().uuid().nullable().openapi({
      example: "2b4b7b2e-6d67-4c1a-9b0c-7b2c7b3f5d8e",
    }),
    child_name: z.string().nullable().openapi({ example: "페이커" }),
  })
  .openapi("ChildStatus");

defineRoute(router, {
  method: "get",
  path: "/check",
  docPath: "/api/me/check",
  summary: "자녀 보유 확인",
  tags: ["Me"],
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z
            .object({
              success: z.literal(true),
              message: z.string().nullable(),
              data: ChildStatusZ,
            })
            .openapi("ApiSuccessChildStatus"),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
  handler: async (_ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
    const status = await getChildStatus(userId);
    return success(res, status);
  },
});

module.exports = router;
