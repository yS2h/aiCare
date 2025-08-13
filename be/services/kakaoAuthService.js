const { BadRequestError } = require("../utils/ApiError");

async function getTokenInfo(accessToken) {
  const res = await fetchWithTimeout(
    "https://kapi.kakao.com/v1/user/access_token_info",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new BadRequestError("카카오 토큰 검증 실패", {
      status: res.status,
      body,
    });
  }
  return res.json();
}

async function getUserMe(accessToken) {
  const res = await fetchWithTimeout("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new BadRequestError("카카오 사용자 정보 조회 실패", {
      status: res.status,
      body,
    });
  }
  const data = await res.json();

  const id = String(data.id);
  const nickname =
    data.kakao_account?.profile?.nickname ??
    data.properties?.nickname ??
    `카카오유저_${id.slice(-4)}`;

  const profile_image_url =
    data.kakao_account?.profile?.profile_image_url ??
    data.properties?.profile_image ??
    "";

  return { id, nickname, profile_image_url };
}

// fetch 타임아웃 + 간단 재시도 래퍼
async function fetchWithTimeout(
  url,
  options = {},
  { timeoutMs = 8000, retries = 1 } = {}
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      // 5xx는 재시도 대상
      if (res.status >= 500 && attempt < retries) {
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt < retries) continue;
      throw err;
    }
  }
}

module.exports = { getTokenInfo, getUserMe };
