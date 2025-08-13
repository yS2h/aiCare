const { v4: uuidv4 } = require("uuid");
const { query } = require("../providers/db");

async function upsertSocialUser(input) {
  const id = uuidv4();

  const sql = `
    INSERT INTO users (id, provider, provider_id, name, profile_image_url)
    VALUES ($1, $2, $3, $4, COALESCE($5, ''))
    ON CONFLICT (provider, provider_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      profile_image_url = CASE
        WHEN EXCLUDED.profile_image_url IS NULL OR EXCLUDED.profile_image_url = ''
          THEN users.profile_image_url
        ELSE EXCLUDED.profile_image_url
      END
    RETURNING id, provider, provider_id, name, profile_image_url, created_at;
  `;

  const params = [
    id,
    "kakao",
    input.provider_id,
    input.name ?? "",
    input.profile_image_url ?? "",
  ];

  const { rows } = await query(sql, params);
  return rows[0];
}

module.exports = { upsertSocialUser };
