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
      .openapi({ format: "date", example: "2025-08-18" }),
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
      bmi: null,
      notes: "감기 후 체중 감소 추정",
    },
  });

const growthExample = {
  id: "8a8d7c16-0b5a-4a4d-8a8f-8b2a2f4f7c3e",
  child_id: "2b9a3e9f-4d38-4b5a-9a2a-0e6d2c0a8f00",
  recorded_at: "2025-08-18",
  height_cm: 132.4,
  weight_kg: 29.1,
  bmi: 16.6,
  notes: "감기 후 체중 감소 추정",
  created_at: "2025-08-18T13:12:34.000Z",
  updated_at: "2025-08-18T13:12:34.000Z",
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
            recorded_at: "2025-08-18",
            height_cm: 132.4,
            weight_kg: 29.1,
            bmi: null,
            notes: "감기 후 체중 감소 추정",
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

const GrowthRecordListQuery = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .openapi({
        description: "시작 날짜",
        format: "date",
        example: "2025-08-01",
      }),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .openapi({
        description: "종료 날짜",
        format: "date",
        example: "2025-08-31",
      }),
    order: z
      .enum(["asc", "desc"])
      .optional()
      .openapi({ example: "desc", description: "정렬" }),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .openapi({ example: 50, description: "페이지 크기(기본 100, 최대 200)" }),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ example: 0, description: "건너뛸 개수" }),
  })
  .openapi("GrowthRecordListQuery");

const GrowthRecordListData = z
  .object({
    items: z.array(GrowthRecordSchema),
    total: z.number().int(),
  })
  .openapi("GrowthRecordListData", {
    example: {
      items: [growthExample],
      total: 1,
    },
  });

defineRoute(router, {
  method: "get",
  path: "/children/:childId/growth",
  docPath: "/api/children/{childId}/growth",
  summary: "성장 이력 목록 조회",
  tags: ["Growth"],
  request: {
    params: ParamsSchema,
    query: GrowthRecordListQuery,
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: GrowthRecordListData,
          }),
          example: {
            success: true,
            data: {
              items: [growthExample],
              total: 1,
            },
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
    const { from, to, order = "desc", limit = 100, offset = 0 } = ctx.query;

    const list = await listGrowthRecords({
      userId,
      childId,
      from,
      to,
      order,
      limit,
      offset,
    });

    return success(res, list);
  },
});

module.exports = router;
