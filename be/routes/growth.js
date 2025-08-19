const express = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { query } = require("../providers/db");
const { success } = require("../utils/response");
const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../utils/ApiError");

const router = express.Router();

const paramsSchema = z.object({
  childId: z.string().uuid(),
});

const createBodySchema = z.object({
  height: z.number().positive(),
  weight: z.number().positive(),
  measured_at: z.string().datetime().optional(),
});

defineRoute(router, {
  method: "post",
  path: "/children/:childId/growth",
  summary: "성장이력 등록",
  tags: ["Growth"],
  security: [{ session: [] }, { bearerAuth: [] }],
  request: {
    params: paramsSchema,
    body: createBodySchema,
  },
  responses: {
    200: { description: "OK" },
    401: { description: "Unauthorized" },
    404: { description: "Child Not Found" },
  },
  handler: async (req) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { childId } = req.params;
    const { height, weight, measured_at } = req.body;

    const { rows: childRows } = await query(
      "SELECT id FROM children WHERE id = $1 AND user_id = $2",
      [childId, userId]
    );
    if (childRows.length === 0) throw new NotFoundError("Child not found");

    const { rows } = await query(
      `
      INSERT INTO growths (id, child_id, height, weight, measured_at)
      VALUES (gen_random_uuid(), $1, $2, $3, COALESCE($4, NOW()))
      RETURNING id, child_id, height, weight, measured_at
      `,
      [childId, height, weight, measured_at ?? null]
    );

    return success(rows[0]);
  },
});

defineRoute(router, {
  method: "get",
  path: "/children/:childId/growth",
  summary: "성장이력 목록",
  tags: ["Growth"],
  security: [{ session: [] }, { bearerAuth: [] }],
  request: {
    params: paramsSchema,
  },
  responses: {
    200: { description: "OK" },
    401: { description: "Unauthorized" },
    404: { description: "Child Not Found" },
  },
  handler: async (req) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const { childId } = req.params;

    const { rows: childRows } = await query(
      "SELECT id FROM children WHERE id = $1 AND user_id = $2",
      [childId, userId]
    );
    if (childRows.length === 0) throw new NotFoundError("Child not found");

    const { rows } = await query(
      `
      SELECT id, child_id, height, weight, measured_at
      FROM growths
      WHERE child_id = $1
      ORDER BY measured_at DESC
      `,
      [childId]
    );

    return success(rows);
  },
});

module.exports = router;
