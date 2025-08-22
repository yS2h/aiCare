const { query } = require("../providers/db");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, BadRequestError } = require("../utils/ApiError");

async function findChildIdByUserId(userId) {
  const { rows } = await query(
    `SELECT id FROM children WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  if (rows.length === 0) {
    throw new NotFoundError(
      "등록된 아이가 없습니다. 먼저 아이 정보를 등록하세요."
    );
  }
  if (rows.length > 1) {
    throw new BadRequestError(
      "한 유저에 아이가 여러 명입니다. 관리자에게 문의하세요."
    );
  }
  return rows[0].id;
}

/**
 * @param {{
 *  userId: string,
 *  type: 'xray'|'posture',
 *  takenAt?: string|null,
 *  width?: number|null,
 *  height?: number|null,
 *  notes?: string|null,
 *  file: { buffer: Buffer, originalname?: string, mimetype: string, size?: number }
 * }} params
 */
async function createImageRecord({
  userId,
  type,
  takenAt,
  width,
  height,
  notes,
  file,
}) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");
  if (!file?.buffer || !file?.mimetype) {
    throw new BadRequestError("업로드 파일이 필요합니다.");
  }
  if (!["xray", "posture"].includes(type)) {
    throw new BadRequestError("type은 xray | posture 중 하나여야 합니다.");
  }

  const childId = await findChildIdByUserId(userId);
  const id = uuidv4();

  const sql = `
    INSERT INTO images
      (id, child_id, type, taken_at, uploaded_at, width, height, notes, filename, mime, data, size)
    VALUES
      ($1, $2, $3, $4, now(), $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, child_id, type, taken_at, uploaded_at, width, height, notes, filename, mime, size
  `;
  const params = [
    id,
    childId,
    type,
    takenAt ?? null,
    width ?? null,
    height ?? null,
    notes ?? null,
    file.originalname ?? "upload",
    file.mimetype,
    file.buffer, // Buffer → BYTEA
    file.size ?? file.buffer.length ?? null,
  ];

  const { rows } = await query(sql, params);
  return rows[0];
}

async function listImagesByType({ userId, type, limit = 100 }) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");
  if (!["xray", "posture"].includes(type))
    throw new BadRequestError("type은 xray | posture 중 하나여야 합니다.");

  const childId = await findChildIdByUserId(userId);

  const sql = `
    SELECT id, child_id, type, taken_at, uploaded_at, width, height, notes, filename, mime, size
    FROM images
    WHERE child_id = $1 AND type = $2
    ORDER BY COALESCE(taken_at, uploaded_at) DESC, uploaded_at DESC, id DESC
    LIMIT $3
  `;
  const { rows } = await query(sql, [
    childId,
    type,
    Math.max(1, Math.min(500, limit)),
  ]);
  return rows;
}

async function getImageBinary({ userId, imageId }) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");
  const childId = await findChildIdByUserId(userId);

  const { rows } = await query(
    `
    SELECT id, child_id, mime, size, data, filename
    FROM images
    WHERE id = $1 AND child_id = $2
    `,
    [imageId, childId]
  );
  if (rows.length === 0) throw new NotFoundError("이미지를 찾을 수 없습니다.");
  return rows[0];
}

module.exports = {
  createImageRecord,
  listImagesByType,
  getImageBinary,
};
