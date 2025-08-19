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

async function assertChildOwnedByUser(childId, userId) {
  const { rows } = await query(
    "SELECT 1 FROM children WHERE id = $1 AND user_id = $2",
    [childId, userId]
  );
  if (rows.length === 0) {
    throw new NotFoundError("해당 아이를 찾을 수 없거나 접근 권한이 없습니다.");
  }
}

async function upsertGrowthRecord({
  userId,
  childId,
  recordedAt,
  heightCm,
  weightKg,
  bmi,
  notes,
}) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");

  await assertChildOwnedByUser(childId, userId);

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
