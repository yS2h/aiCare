const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { UnauthorizedError } = require("../utils/ApiError");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");
const {
  listBoneInfo,
  getBoneInfoById,
} = require("../services/boneInfoService");

extendZodWithOpenApi(z);

const router = Router();

const BoneInfoSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    bone_age: z.string().min(1),
    image_url: z.string().url(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("BoneInfo");

const BoneInfoIdParams = z
  .object({
    id: z.string().uuid(),
  })
  .openapi("BoneInfoIdParams");

defineRoute(router, {
  method: "get",
  path: "/bone",
  docPath: "/api/bone",
  summary: "뼈 정보 목록 조회",
  tags: ["Bone"],
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(BoneInfoSchema),
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "child not found" },
    400: { description: "invalid state (multiple children)" },
  },
  handler: async (_ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const rows = await listBoneInfo({ userId });
    return success(res, rows);
  },
});

defineRoute(router, {
  method: "get",
  path: "/bone/:id",
  docPath: "/api/bone/{id}",
  summary: "뼈 정보 단건 조회",
  tags: ["Bone"],
  request: {
    params: BoneInfoIdParams,
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: BoneInfoSchema,
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "record not found" },
    400: { description: "invalid state (multiple children)" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { id } = ctx.params;
    const row = await getBoneInfoById({ userId, id });
    return success(res, row);
  },
});

module.exports = router;
