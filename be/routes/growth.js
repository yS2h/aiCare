const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { upsertGrowthRecord } = require("../services/growthRecordService");
const { UnauthorizedError } = require("../utils/ApiError");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");

extendZodWithOpenApi(z);

const router = Router();

const GrowthRecordSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    recorded_at: z.string(),
    height_cm: z.number(),
    weight_kg: z.number(),
    bmi: z.number().nullable(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("GrowthRecord");

const BodySchema = z
  .object({
    recorded_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .openapi({ example: "2025-08-18" }),
    height_cm: z.number().gt(0).lte(300).openapi({ example: 132.4 }),
    weight_kg: z.number().gt(0).lte(400).openapi({ example: 29.1 }),
    bmi: z
      .number()
      .gt(0)
      .lte(200)
      .optional()
      .nullable()
      .openapi({ example: 16.6 }),
    notes: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .openapi({ example: "감기 후 체중 감소 추정" }),
  })
  .openapi("GrowthRecordUpsertBody", {
    example: {
      recorded_at: "2025-08-18",
      height_cm: 132.4,
      weight_kg: 29.1,
      bmi: 16.6,
      notes: "감기 후 체중 감소 추정",
    },
  });

defineRoute(router, {
  method: "post",
  path: "/growth",
  docPath: "/api/children/growth",
  summary: "성장 이력 등록/수정",
  tags: ["Growth"],
  request: {
    body: BodySchema,
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: GrowthRecordSchema,
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

    const { recorded_at, height_cm, weight_kg, bmi, notes } = ctx.body;

    const record = await upsertGrowthRecord({
      userId,
      recordedAt: recorded_at,
      heightCm: height_cm,
      weightKg: weight_kg,
      bmi,
      notes,
    });

    return success(res, record);
  },
});

module.exports = router;
