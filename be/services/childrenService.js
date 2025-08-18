const { v4: uuidv4 } = require("uuid");
const { query } = require("../providers/db");

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
    payload.gender, // 'male' | 'female'
    payload.birth_date, // 'YYYY-MM-DD'
    payload.height, // number
    payload.weight, // number
    payload.father_height, // number
    payload.mother_height, // number
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

module.exports = { upsertChild, getChildByUserId };
