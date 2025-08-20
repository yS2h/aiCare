const { query } = require("../providers/db");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, BadRequestError } = require("../utils/ApiError");

function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!(h > 0) || !(w > 0)) return null;
  const bmi = w / Math.pow(h / 100, 2);
  return Math.round(bmi * 10) / 10;
}

async function resolveSingleChildIdByUser(userId) {
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

async function upsertGrowthRecord({
  userId,
  recordedAt,
  heightCm,
  weightKg,
  bmi,
  notes,
}) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");

  const childId = await resolveSingleChildIdByUser(userId);
  const id = uuidv4();
  const bmiValue = bmi ?? calcBmi(heightCm, weightKg);

  const sql = `
    INSERT INTO growth_record
      (id, child_id, recorded_at, height_cm, weight_kg, bmi, notes)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (child_id, recorded_at) DO UPDATE SET
      height_cm = EXCLUDED.height_cm,
      weight_kg = EXCLUDED.weight_kg,
      bmi       = EXCLUDED.bmi,
      notes     = EXCLUDED.notes,
      updated_at = now()
    RETURNING *;
  `;
  const params = [
    id,
    childId,
    recordedAt,
    heightCm,
    weightKg,
    bmiValue,
    notes ?? null,
  ];
  const { rows } = await query(sql, params);
  return rows[0];
}

module.exports = {
  upsertGrowthRecord,
};
