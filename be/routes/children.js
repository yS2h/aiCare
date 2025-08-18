const { Router } = require("express");
const { z } = require("zod");
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

router.post("/", async (req, res, next) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ApiError(400, "Validation failed", parsed.error.flatten()));
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
});

module.exports = router;
