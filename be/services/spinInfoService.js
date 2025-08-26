const { query } = require("../providers/db");
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

async function listSpineInfo({ userId }) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");
  const childId = await findChildIdByUserId(userId);

  const { rows } = await query(
    `
    SELECT *
    FROM spine_info
    WHERE child_id = $1
    ORDER BY recorded_at DESC, updated_at DESC, created_at DESC
    `,
    [childId]
  );
  return rows;
}

async function getSpineInfoById({ userId, id }) {
  if (!userId) throw new BadRequestError("로그인이 필요합니다.");
  if (!id) throw new BadRequestError("id가 필요합니다.");

  const { rows } = await query(
    `
    SELECT si.*
    FROM spine_info si
    JOIN children c ON c.id = si.child_id
    WHERE si.id = $1 AND c.user_id = $2
    `,
    [id, userId]
  );
  if (rows.length === 0) {
    throw new NotFoundError("데이터를 찾을 수 없거나 접근 권한이 없습니다.");
  }
  return rows[0];
}

module.exports = {
  listSpineInfo,
  getSpineInfoById,
};
