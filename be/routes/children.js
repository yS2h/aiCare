const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { ApiError } = require("../utils/ApiError");
const { success } = require("../utils/response");
const { upsertChild } = require("../services/childrenService");

const router = Router();

const bodySchema = z.object({
  name: z.string().min(1),
  gender: z.enum(["male", "female"]),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  height: z.coerce.number().positive(),
  weight: z.coerce.number().positive(),
  father_height: z.coerce.number().positive(),
  mother_height: z.coerce.number().positive(),
});

const ChildUpsertRequestSchema = {
  type: "object",
  required: [
    "name",
    "gender",
    "birth_date",
    "height",
    "weight",
    "father_height",
    "mother_height",
  ],
  properties: {
    name: { type: "string", example: "김또이" },
    gender: { type: "string", enum: ["male", "female"], example: "female" },
    birth_date: { type: "string", format: "date", example: "2018-06-01" },
    height: { type: "number", example: 122.4 },
    weight: { type: "number", example: 24.7 },
    father_height: { type: "number", example: 176.2 },
    mother_height: { type: "number", example: 162.3 },
  },
};

const ChildSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      example: "2b4b7b2e-6d67-4c1a-9b0c-7b2c7b3f5d8e",
    },
    user_id: {
      type: "string",
      format: "uuid",
      example: "41cfb563-f5c9-4d4e-a57a-b421b4564f86",
    },
    name: { type: "string", example: "김또이" },
    gender: { type: "string", enum: ["male", "female"], example: "female" },
    birth_date: { type: "string", format: "date", example: "2018-06-01" },
    height: { type: "number", example: 124.0 },
    weight: { type: "number", example: 25.1 },
    father_height: { type: "number", example: 176.2 },
    mother_height: { type: "number", example: 162.3 },
    created_at: {
      type: "string",
      format: "date-time",
      example: "2025-08-18T00:10:11.123Z",
    },
  },
};

const ApiSuccessChildSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean", example: true },
    message: { type: "string", example: "saved" },
    data: ChildSchema,
  },
};

defineRoute(router, {
  method: "post",
  path: "/",
  docPath: "/api/children",
  summary: "아이 정보 등록/수정 (UPSERT by user_id)",
  tags: ["Children"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ChildUpsertRequestSchema,
          example: {
            name: "김또이",
            gender: "female",
            birth_date: "2018-06-01",
            height: 122.4,
            weight: 24.7,
            father_height: 176.2,
            mother_height: 162.3,
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "저장 성공",
      content: {
        "application/json": {
          schema: ApiSuccessChildSchema,
        },
      },
    },
    400: { description: "검증 실패 / UUID 오류 / CHECK 제약 위반" },
    401: { description: "인증 실패" },
    404: { description: "사용자 없음(FK)" },
  },

  handler: async (_ctx, req, res, next) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new ApiError(400, "Validation failed", parsed.error.flatten())
      );
    }

    try {
      const saved = await upsertChild(req.user.id, parsed.data);
      return res.json(success(saved, "saved"));
    } catch (err) {
      if (err?.code === "22P02")
        return next(new ApiError(400, "Invalid UUID for user_id"));
      if (err?.code === "23503")
        return next(new ApiError(404, "User not found (FK)"));
      if (err?.code === "23514")
        return next(new ApiError(400, "Check constraint failed"));
      if (err?.code === "23502")
        return next(new ApiError(400, "Required column is NULL"));
      if (err?.code === "42501")
        return next(new ApiError(500, "DB permission denied"));
      if (err?.code === "42P01")
        return next(new ApiError(500, "Table 'children' not found"));
      return next(err);
    }
  },
});

module.exports = router;
