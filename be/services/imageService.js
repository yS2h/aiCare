// services/imageService.js
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

async function createImageRecord({
  userId,
  type,
  url,
  takenAt,
  width,
  height,
  notes,
}) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");

  const childId = await findChildIdByUserId(userId);
  const id = uuidv4();

  const sql = `
    INSERT INTO images (id, child_id, type, url, taken_at, width, height, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, child_id, type, url, taken_at, uploaded_at, width, height, notes
  `;
  const params = [
    id,
    childId,
    type,
    url,
    takenAt ?? null,
    width ?? null,
    height ?? null,
    notes ?? null,
  ];

  const { rows } = await query(sql, params);
  return rows[0];
}

module.exports = {
  createImageRecord,
};
