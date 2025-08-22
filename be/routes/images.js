const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { success } = require("../utils/response");
const { UnauthorizedError, BadRequestError } = require("../utils/ApiError");
const {
  createImageRecord,
  listImagesByType,
  getImageBinary,
} = require("../services/imageService");
const { extendZodWithOpenApi } = require("@asteasolutions/zod-to-openapi");
const multer = require("multer");

extendZodWithOpenApi(z);
const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error("이미지 파일만 업로드할 수 있습니다."));
  },
});

const ImageTypeSchema = z.enum(["xray", "posture"]).openapi("ImageType");

const CreateImageFieldsSchema = z
  .object({
    type: ImageTypeSchema,
    taken_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.")
      .optional()
      .nullable(),
    width: z.coerce.number().int().gt(0).optional().nullable(),
    height: z.coerce.number().int().gt(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .strict();

const ImageRecordSchema = z
  .object({
    id: z.string().uuid(),
    child_id: z.string().uuid(),
    type: ImageTypeSchema,
    taken_at: z.string().nullable().optional(),
    uploaded_at: z.string(),
    width: z.number().int().nullable().optional(),
    height: z.number().int().nullable().optional(),
    notes: z.string().nullable().optional(),
    filename: z.string(),
    mime: z.string(),
    size: z.number().int().nullable().optional(),
  })
  .openapi("ImageRecord");

router.post("/images", upload.single("file"), async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
    if (!req.file)
      throw new BadRequestError("file 필드로 이미지를 업로드하세요.");

    const parsed = CreateImageFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.issues?.[0]?.message || "유효하지 않은 입력값"
      );
    }
    const { type, taken_at, width, height, notes } = parsed.data;

    const row = await createImageRecord({
      userId,
      type,
      takenAt: taken_at,
      width,
      height,
      notes,
      file: req.file,
    });

    return success(res, row);
  } catch (err) {
    next(err);
  }
});

const simpleUploadHandler = (fixedType) => async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");
    if (!req.file)
      throw new BadRequestError("file 필드로 이미지를 업로드하세요.");

    const row = await createImageRecord({
      userId,
      type: fixedType,
      takenAt: null,
      width: null,
      height: null,
      notes: null,
      file: req.file,
    });

    return success(res, row);
  } catch (err) {
    next(err);
  }
};

router.post("/images/xray", upload.single("file"), simpleUploadHandler("xray"));
router.post(
  "/images/posture",
  upload.single("file"),
  simpleUploadHandler("posture")
);

defineRoute(router, {
  method: "get",
  path: "/images",
  docPath: "/api/images",
  summary: "이미지 목록 조회",
  description:
    "척추 분석(type=posture), 골연령 분석(type=xray) - 메타데이터 목록",
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

router.get("/images/:id/raw", async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) throw new UnauthorizedError("로그인이 필요합니다.");

    const imageId = req.params.id;
    const row = await getImageBinary({ userId, imageId });

    res.setHeader("Content-Type", row.mime || "application/octet-stream");
    if (row.size) res.setHeader("Content-Length", String(row.size));
    res.setHeader("Cache-Control", "no-store");
    return res.end(row.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
