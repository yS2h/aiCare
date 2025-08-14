const { Router } = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { defineRoute } = require("../lib/route");
const { upsertSocialUser } = require("../services/socialAuthService");
const { signJwt } = require("../middlewares/auth");
const {
  getKakaoAuthUrl,
  exchangeCodeForToken,
  getUserMe,
} = require("../services/kakaoAuthService");

const router = Router();

const OAUTH_SUCCESS_REDIRECT =
  process.env.OAUTH_SUCCESS_REDIRECT ||
  "http://localhost:3000/oauth/kakao-result";

defineRoute(router, {
  method: "get",
  path: "/kakao",
  docPath: "/api/auth/kakao",
  summary: "카카오 로그인 시작",
  tags: ["Auth"],
  responses: {
    302: { description: "카카오 OAuth 페이지로 리다이렉트" },
  },
  handler: async (_ctx, req, res) => {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET env 누락" });
    }
    const state = jwt.sign(
      { t: Date.now(), n: crypto.randomBytes(8).toString("hex") },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    let authUrl;
    try {
      authUrl = getKakaoAuthUrl(state);
    } catch (e) {
      return res.status(500).json({ message: e.message || "설정 오류" });
    }
    return res.redirect(authUrl);
  },
});

const KakaoCallbackReq = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

defineRoute(router, {
  method: "get",
  path: "/kakao/callback",
  docPath: "/api/auth/kakao/callback",
  summary: "카카오 OAuth 콜백 처리",
  tags: ["Auth"],
  request: { query: KakaoCallbackReq },
  responses: {
    302: { description: "프론트로 리다이렉트(#token 또는 #error)" },
  },
  handler: async ({ query }, req, res) => {
    const redirectWithHash = (kv) => {
      const u = new URL(OAUTH_SUCCESS_REDIRECT);
      const sp = new URLSearchParams(kv);
      u.hash = sp.toString(); // #k=v&k2=v2
      return res.redirect(u.toString());
    };

    if (!query) {
      return redirectWithHash({ error: "invalid_request" });
    }

    if (query.error) {
      return redirectWithHash({
        error: String(query.error_description || query.error),
      });
    }

    try {
      jwt.verify(query.state, process.env.JWT_SECRET);
    } catch {
      return redirectWithHash({ error: "bad_state" });
    }

    let tokenRes;
    try {
      tokenRes = await exchangeCodeForToken(query.code);
    } catch (e) {
      return redirectWithHash({ error: "token_exchange_failed" });
    }
    const accessToken = tokenRes && tokenRes.access_token;
    if (!accessToken) {
      return redirectWithHash({ error: "no_access_token" });
    }

    let me;
    try {
      me = await getUserMe(accessToken);
    } catch (e) {
      return redirectWithHash({ error: "user_info_failed" });
    }

    let user;
    try {
      user = await upsertSocialUser({
        provider: "kakao",
        provider_id: me.id,
        name: me.nickname,
        profile_image_url: me.profile_image_url ?? "",
      });
    } catch (e) {
      return redirectWithHash({ error: "upsert_failed" });
    }
    let appJwt;
    try {
      appJwt = signJwt(user);
    } catch (e) {
      return redirectWithHash({ error: "issue_app_jwt_failed" });
    }

    return redirectWithHash({
      token: appJwt,
      provider: "kakao",
    });
  },
});

module.exports = router;
