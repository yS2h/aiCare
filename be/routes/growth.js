const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const {
  upsertGrowthRecord,
  listGrowthRecords,
} = require("../services/growthRecordService");
const { UnauthorizedError } = require("../utils/ApiError");

const router = Router();

const GrowthRecordSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    recorded_at: z.string().openapi({ format: "date", example: "2025-08-18" }),
    height_cm: z.number().openapi({ example: 132.4 }),
    weight_kg: z.number().openapi({ example: 29.1 }),
    bmi: z.number().nullable().openapi({ example: 16.6 }),
    notes: z.string().nullable().openapi({ example: "감기 후 체중 감소 추정" }),
    created_at: z
      .string()
      .openapi({ format: "date-time", example: "2025-08-18T13:12:34.000Z" }),
    updated_at: z
      .string()
      .openapi({ format: "date-time", example: "2025-08-18T13:12:34.000Z" }),
  })
  .openapi("GrowthRecord");

const GrowthRecordUpsertBody = z
  .object({
    recorded_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .openapi({ format: "date", example: "2025-08-28" }),
    height_cm: z.number().gt(0).lte(300).openapi({ example: 140.2 }),
    weight_kg: z.number().gt(0).lte(400).openapi({ example: 33.5 }),
    notes: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .openapi({ example: "컨디션 양호" }),
  })
  .openapi("GrowthRecordUpsertBody", {
    example: {
      recorded_at: "2025-08-28",
      height_cm: 140.2,
      weight_kg: 33.5,
      notes: "컨디션 양호",
    },
  });

const growthExample = {
  id: "8a8d7c16-0b5a-4a4d-8a8f-8b2a2f4f7c3e",
  child_id: "2b9a3e9f-4d38-4b5a-9a2a-0e6d2c0a8f00",
  recorded_at: "2025-08-28",
  height_cm: 140.2,
  weight_kg: 33.5,
  bmi: 17.1,
  notes: "컨디션 양호",
  created_at: "2025-08-28T13:12:34.000Z",
  updated_at: "2025-08-28T13:12:34.000Z",
};

const ParamsSchema = z
  .object({ childId: z.string().uuid() })
  .openapi("GrowthRecordParams");

defineRoute(router, {
  method: "post",
  path: "/children/:childId/growth",
  docPath: "/api/children/{childId}/growth",
  summary: "성장 이력 등록/수정",
  tags: ["Growth"],
  request: {
    params: ParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: GrowthRecordUpsertBody,
          example: {
            recorded_at: "2025-08-28",
            height_cm: 140.2,
            weight_kg: 33.5,
            notes: "컨디션 양호",
          },
        },
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
          example: { success: true, data: growthExample },
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
    const { recorded_at, height_cm, weight_kg, notes } = ctx.body;

    const record = await upsertGrowthRecord({
      userId,
      childId,
      recordedAt: recorded_at,
      heightCm: height_cm,
      weightKg: weight_kg,
      notes,
    });

    return success(res, record);
  },
});

defineRoute(router, {
  method: "get",
  path: "/children/:childId/growth",
  docPath: "/api/children/{childId}/growth",
  summary: "성장 이력 목록",
  tags: ["Growth"],
  request: { params: ParamsSchema },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(GrowthRecordSchema),
          }),
          example: {
            success: true,
            data: [
              growthExample,
              {
                ...growthExample,
                id: "0f6a5a3b-1111-2222-3333-444444444444",
                recorded_at: "2025-08-24",
                height_cm: 139.7,
                weight_kg: 33.0,
                bmi: 16.9,
                created_at: "2025-08-24T09:00:00.000Z",
                updated_at: "2025-08-24T09:00:00.000Z",
              },
            ],
          },
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
    const records = await listGrowthRecords({ userId, childId });

    return success(res, records);
  },
});

module.exports = router;
