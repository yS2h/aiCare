const { BadRequestError } = require("../utils/ApiError");

let fetch;
if (typeof globalThis.fetch === "undefined") {
  fetch = require("node-fetch");
} else {
  fetch = globalThis.fetch;
}

async function fetchWithTimeout(url, options = {}) {
  const { timeout = 10000, retries = 1, ...rest } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, { ...rest, signal: controller.signal });
      clearTimeout(timer);
      if (res.status >= 500 && attempt < retries) continue;
      return res;
    } catch (e) {
      clearTimeout(timer);
      if (attempt < retries) continue;
      throw e;
    }
  }
}

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || "";
const KAKAO_REDIRECT_URI =
  process.env.KAKAO_REDIRECT_URI ||
  "http://localhost:5000/api/auth/kakao/callback";

/**
 * Kakao authorize URL 생성
 * @param {string} state
 */
function getKakaoAuthUrl(state) {
  if (!KAKAO_CLIENT_ID || !KAKAO_REDIRECT_URI) {
    throw new Error("KAKAO_CLIENT_ID/KAKAO_REDIRECT_URI env 누락");
  }
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: "code",
    scope: "profile_nickname profile_image",
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code, redirectUri = KAKAO_REDIRECT_URI) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KAKAO_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  });
  if (KAKAO_CLIENT_SECRET) body.append("client_secret", KAKAO_CLIENT_SECRET);

  const res = await fetchWithTimeout("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new BadRequestError(
      `Kakao token exchange failed: ${data.error_description || res.statusText}`
    );
  }
  return data;
}

async function getUserMe(accessToken) {
  const res = await fetchWithTimeout("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BadRequestError(
      `Kakao user info failed: ${data.error_description || res.statusText}`
    );
  }

  const account = data.kakao_account || {};
  const profile = account.profile || {};

  return {
    id: String(data.id),
    nickname: profile.nickname || "",
    profile_image_url:
      profile.profile_image_url || profile.thumbnail_image_url || "",
    email: account.has_email && account.email ? account.email : "",
  };
}

module.exports = {
  fetchWithTimeout,
  getKakaoAuthUrl,
  exchangeCodeForToken,
  getUserMe,
};
