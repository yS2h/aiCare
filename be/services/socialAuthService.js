const { v4: uuidv4 } = require("uuid");
const { query } = require("../providers/db");

/**
 * Upsert a social user to Postgres
 * @param {{provider: 'kakao'|'google', provider_id: string, name: string, profile_image_url?: string}} input
 * @returns {Promise<User>}
 */
async function upsertSocialUser(input) {
  const id = uuidv4();

  const res = await query(
    `
    insert into users (id, provider, provider_id, name, profile_image_url)
    values ($1, $2, $3, $4, coalesce($5, ''))
    on conflict (provider, provider_id)
    do update set
      name = excluded.name,
      profile_image_url = case
        when excluded.profile_image_url is null or excluded.profile_image_url = ''
          then users.profile_image_url
        else excluded.profile_image_url
      end,
      updated_at = now()
    returning id, provider, provider_id, name, profile_image_url, created_at, updated_at
    `,
    [
      id,
      input.provider,
      input.provider_id,
      input.name,
      input.profile_image_url ?? "",
    ]
  );

  return res.rows[0];
}

module.exports = { upsertSocialUser };
