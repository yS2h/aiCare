const { query } = require("../providers/db");

/**
 * Upsert a social user to Postgres
 * @param {{provider: 'kakao', provider_id: string, name: string, profile_image_url?: string}} input
 * @returns {Promise<{
 *   id: string, provider: 'kakao', provider_id: string, name: string,
 *   profile_image_url: string, created_at: string
 * }>}
 */
async function upsertSocialUser(input) {
  const sql = `
    INSERT INTO users (provider, provider_id, name, profile_image_url)
    VALUES ($1, $2, $3, COALESCE($4, ''))
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
    "kakao",
    input.provider_id,
    input.name ?? "",
    input.profile_image_url ?? "",
  ];

  const { rows } = await query(sql, params);
  return rows[0];
}

module.exports = { upsertSocialUser };
