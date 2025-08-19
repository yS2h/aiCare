const { Router } = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { defineRoute } = require("../lib/route");
const { upsertSocialUser } = require("../services/socialAuthService");
const {
  getKakaoAuthUrl,
  exchangeCodeForToken,
  getUserMe,
} = require("../services/kakaoAuthService");

const router = Router();

function setLoginSession(req, user) {
  req.session.user = {
    id: user.id,
    name: user.name || null,
    email: user.email || null,
    avatarUrl: user.avatarUrl || null,
  };

  req.session.userId = user.id;

  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

const getSuccessRedirect = () => {
  const base =
    process.env.NODE_ENV === "production"
      ? process.env.OAUTH_SUCCESS_REDIRECT_PROD ||
        process.env.OAUTH_SUCCESS_REDIRECT
      : process.env.OAUTH_SUCCESS_REDIRECT;

  return base || "http://localhost:5173/";
};

const redirectToFrontend = (res, ok, extra = {}) => {
  const u = new URL(getSuccessRedirect());
  const sp = new URLSearchParams({ auth: ok ? "ok" : "fail", ...extra });
  u.hash = sp.toString();
  return res.redirect(u.toString());
};

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

    try {
      const authUrl = getKakaoAuthUrl(state);
      return res.redirect(authUrl);
    } catch (e) {
      return res.status(500).json({ message: e.message || "설정 오류" });
    }
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
  summary: "카카오 OAuth 콜백 처리 (세션 로그인)",
  tags: ["Auth"],
  responses: {
    302: { description: "프론트로 리다이렉트(#auth=ok|fail)" },
  },
  handler: async (_ctx, req, res) => {
    const parsed = KakaoCallbackReq.safeParse(req.query);
    if (!parsed.success) {
      return redirectToFrontend(res, false, { reason: "bad_query" });
    }
    const { code, state, error } = parsed.data;
    if (error) {
      return redirectToFrontend(res, false, { reason: "kakao_error" });
    }

    try {
      jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return redirectToFrontend(res, false, { reason: "state" });
    }

    let accessToken;
    try {
      const tokenRes = await exchangeCodeForToken(code);
      accessToken = tokenRes && tokenRes.access_token;
      if (!accessToken) throw new Error("no_access_token");
    } catch {
      return redirectToFrontend(res, false, { reason: "token" });
    }

    let me;
    try {
      me = await getUserMe(accessToken);
      if (!me?.id) throw new Error("no_kakao_user");
    } catch {
      return redirectToFrontend(res, false, { reason: "me" });
    }

    let user;
    try {
      user = await upsertSocialUser({
        provider: "kakao",
        provider_id: me.id,
        name: me.nickname,
        profile_image_url: me.profile_image_url ?? "",
      });
      if (!user?.id) throw new Error("no_local_user");
    } catch {
      return redirectToFrontend(res, false, { reason: "db" });
    }

    try {
      await setLoginSession(req, {
        id: user.id,
        name: user.name ?? me.nickname,
        email: user.email ?? null,
        avatarUrl: user.profile_image_url ?? me.profile_image_url ?? "",
      });
    } catch {
      return redirectToFrontend(res, false, { reason: "session" });
    }

    return redirectToFrontend(res, true);
  },
});

module.exports = router;
