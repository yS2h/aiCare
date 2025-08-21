const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { UnauthorizedError } = require("../utils/ApiError");
const {
  createImageRecord,
  listImagesByType,
} = require("../services/imageService");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");

extendZodWithOpenApi(z);

const router = Router();

const ImageTypeSchema = z.enum(["xray", "posture"]).openapi("ImageType");

const CreateImageBodySchema = z
  .object({
    type: ImageTypeSchema.openapi({ example: "xray" }),
    url: z
      .string()
      .url()
      .openapi({ example: "https://cdn.example.com/path/file.png" }),
    taken_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
      .optional()
      .nullable()
      .openapi({ example: "2025-08-01" }),
    width: z
      .number()
      .int()
      .gt(0)
      .optional()
      .nullable()
      .openapi({ example: 2048 }),
    height: z
      .number()
      .int()
      .gt(0)
      .optional()
      .nullable()
      .openapi({ example: 3072 }),
    notes: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .openapi({ example: "좌측 손 X-ray (PA view)" }),
  })
  .openapi("CreateImageBody", {
    example: {
      type: "xray",
      url: "https://cdn.example.com/ai-care/xray/child-123/2025-08-01-1530.png",
      taken_at: "2025-08-01",
      width: 2048,
      height: 3072,
      notes: "좌측 손 X-ray (PA view)",
    },
  });

const ImageRecordSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    type: ImageTypeSchema,
    url: z.string().url(),
    taken_at: z.string().nullable().optional(),
    uploaded_at: z.string(),
    width: z.number().int().nullable().optional(),
    height: z.number().int().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .openapi("ImageRecord");

defineRoute(router, {
  method: "post",
  path: "/images",
  docPath: "/api/images",
  summary: "이미지 등록",
  tags: ["Images"],
  request: {
    body: CreateImageBodySchema,
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: ImageRecordSchema,
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "child not found" },
    400: { description: "invalid state (multiple children)" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { type, url, taken_at, width, height, notes } = ctx.body;

    const row = await createImageRecord({
      userId,
      type,
      url,
      takenAt: taken_at,
      width,
      height,
      notes,
    });

    return success(res, row);
  },
});

defineRoute(router, {
  method: "get",
  path: "/images",
  docPath: "/api/images",
  summary: "이미지 목록 조회",
  description:
    "척추 분석 페이지(type: posture), 골연령 분석 페이지(type: xray)",
  tags: ["Images"],
  request: {
    query: z
      .object({
        type: ImageTypeSchema.openapi({ example: "posture" }),
        limit: z
          .string()
          .regex(/^\d+$/)
          .transform((v) => parseInt(v, 10))
          .optional()
          .openapi({ example: "50" }),
      })
      .openapi("ListImagesQuery"),
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(ImageRecordSchema),
          }),
        },
      },
    },
    401: { description: "unauthorized" },
    404: { description: "child not found" },
    400: { description: "invalid state (multiple children or bad query)" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { type, limit } = ctx.query;
    const rows = await listImagesByType({ userId, type, limit });

    return success(res, rows);
  },
});

module.exports = router;
