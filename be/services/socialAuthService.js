const { v4: uuidv4 } = require("uuid");

const users = new Map();

/**
 * Upsert a social user.
 * @param {{provider: 'kakao', provider_id: string, name: string, profile_image_url?: string}} input
 * @returns {User}
 */
function upsertSocialUser(input) {
  const key = `${input.provider}:${input.provider_id}`;
  const now = new Date().toISOString();

  if (!users.has(key)) {
    const user = {
      id: uuidv4(),
      provider: input.provider,
      provider_id: input.provider_id,
      name: input.name,
      profile_image_url: input.profile_image_url || "",
      created_at: now,
    };
    users.set(key, user);
  } else {
    const prev = users.get(key);

    prev.name = input.name ?? prev.name;
    if (input.profile_image_url)
      prev.profile_image_url = input.profile_image_url;
  }

  return users.get(key);
}

module.exports = { upsertSocialUser };
