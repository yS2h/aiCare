const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { upsertGrowthRecord } = require("../services/growthRecordService");
const { UnauthorizedError } = require("../utils/ApiError");
const {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} = require("@asteasolutions/zod-to-openapi");

extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

const router = Router();

const GrowthRecordSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    recorded_at: z.string(), // 'YYYY-MM-DD'
    height_cm: z.number(),
    weight_kg: z.number(),
    bmi: z.number().nullable(),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("GrowthRecord");

const ParamsSchema = z
  .object({
    childId: z.string().uuid(),
  })
  .openapi("GrowthRecordParams");

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
  .openapi("GrowthRecordUpsertBody");

defineRoute(router, {
  method: "post",
  path: "/children/:childId/growth",
  docPath: "/api/children/{childId}/growth",
  summary: "성장 이력 등록/수정 (UPSERT: child_id+recorded_at)",
  tags: ["Growth"],
  request: {
    params: ParamsSchema,
    body: {
      content: {
        "application/json": { schema: BodySchema },
      },
    },
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
    404: { description: "child not found or not owned" },
  },
  handler: async (ctx, req, res) => {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const { childId } = ctx.params;
    const { recorded_at, height_cm, weight_kg, bmi, notes } = ctx.body;

    const record = await upsertGrowthRecord({
      userId,
      childId,
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
