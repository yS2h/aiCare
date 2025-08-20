const { v4: uuidv4 } = require("uuid");
const { query } = require("../providers/db");
const { ApiError } = require("../utils/ApiError");

async function upsertChild(userId, payload) {
  const id = uuidv4();

  const sql = `
    INSERT INTO children (
      id, user_id, name, gender, birth_date,
      height, weight, father_height, mother_height
    )
    VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9)
    ON CONFLICT (user_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      gender = EXCLUDED.gender,
      birth_date = EXCLUDED.birth_date,
      height = EXCLUDED.height,
      weight = EXCLUDED.weight,
      father_height = EXCLUDED.father_height,
      mother_height = EXCLUDED.mother_height
    RETURNING *;
  `;

  const params = [
    id,
    userId,
    payload.name,
    payload.gender,
    payload.birth_date,
    payload.height,
    payload.weight,
    payload.father_height,
    payload.mother_height,
  ];

  const { rows } = await query(sql, params);
  return rows[0];
}

async function getChildByUserId(userId) {
  const { rows } = await query(
    `SELECT * FROM children WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function getChildIdOrThrow(userId) {
  const { rows } = await query(
    `SELECT id FROM children WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) {
    throw new ApiError(404, "등록된 아이 정보가 없습니다.");
  }
  return rows[0].id;
}

async function getChildStatus(userId) {
  const { rows } = await query(
    `SELECT id, name
       FROM children
      WHERE user_id = $1
      LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) {
    return { has_child: false, child_id: null, child_name: null };
  }
  return { has_child: true, child_id: rows[0].id, child_name: rows[0].name };
}

module.exports = {
  upsertChild,
  getChildByUserId,
  getChildIdOrThrow,
  getChildStatus,
};
