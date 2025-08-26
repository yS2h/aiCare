const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { UnauthorizedError } = require("../utils/ApiError");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");
const {
  listSpineInfo,
  getSpineInfoById,
} = require("../services/spineInfoService");

extendZodWithOpenApi(z);

const router = Router();

const SpineMeasurementSchema = z
  .object({
    angle: z.number().openapi({ example: 3.3 }),
    apex: z.string().min(1).openapi({ example: "T2" }),
    direction: z.enum(["좌측", "우측"]).openapi({ example: "좌측" }),
  })
  .openapi("SpineMeasurement");

const SpineInfoSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    recorded_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    image_url: z.string().url(),
    measurements: z.array(SpineMeasurementSchema).length(3),
    notes: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("SpineInfo");

const SpineInfoIdParams = z
  .object({
    id: z.string().uuid(),
  })
  .openapi("SpineInfoIdParams");

defineRoute(router, {
  method: "get",
  path: "/spine",
  docPath: "/api/spine",
  summary: "척추 정보 목록 조회",
  tags: ["Spine"],
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(SpineInfoSchema),
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

    const rows = await listSpineInfo({ userId });
    return success(res, rows);
  },
});

defineRoute(router, {
  method: "get",
  path: "/spine/:id",
  docPath: "/api/spine/{id}",
  summary: "척추 정보 단건 조회",
  tags: ["Spine"],
  request: {
    params: SpineInfoIdParams,
  },
  responses: {
    200: {
      description: "ok",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: SpineInfoSchema,
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
    const row = await getSpineInfoById({ userId, id });
    return success(res, row);
  },
});

module.exports = router;
