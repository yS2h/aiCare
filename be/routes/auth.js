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

const OAUTH_SUCCESS_REDIRECT = process.env.OAUTH_SUCCESS_REDIRECT;

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
  responses: {
    302: { description: "프론트로 리다이렉트(#token 또는 #error)" },
  },
  handler: async (ctx, req, res) => {
    console.log("=== 카카오 콜백 요청 ===");
    console.log("req.query:", req.query);
    console.log("req.url:", req.url);
    console.log("req.headers:", req.headers);

    const query = req.query;

    const redirectWithHash = (kv) => {
      const u = new URL(OAUTH_SUCCESS_REDIRECT);
      const sp = new URLSearchParams(kv);
      u.hash = sp.toString(); // #k=v&k2=v2
      return res.redirect(u.toString());
    };

    const redirectToFrontend = (success = true) => {
      if (success) {
        res.cookie("authToken", appJwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.cookie("authProvider", "kakao", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      return res.redirect(OAUTH_SUCCESS_REDIRECT || "http://localhost:5173/");
    };

    if (!query) {
      console.log("query가 undefined입니다");
      return redirectToFrontend(false);
    }

    if (!query.code || !query.state) {
      console.log("필수 파라미터 누락:", {
        code: query.code,
        state: query.state,
      });
      return redirectToFrontend(false);
    }

    console.log("파라미터 검증 성공:", {
      code: query.code,
      state: query.state,
    });

    if (query.error) {
      return redirectToFrontend(false);
    }

    try {
      jwt.verify(query.state, process.env.JWT_SECRET);
      console.log("state JWT 검증 성공");
    } catch (e) {
      console.log("state JWT 검증 실패:", e.message);
      return redirectToFrontend(false);
    }

    let tokenRes;
    try {
      tokenRes = await exchangeCodeForToken(query.code);
      console.log("카카오 액세스 토큰 교환 성공");
    } catch (e) {
      console.log("카카오 액세스 토큰 교환 실패:", e.message);
      return redirectToFrontend(false);
    }
    const accessToken = tokenRes && tokenRes.access_token;
    if (!accessToken) {
      console.log("액세스 토큰이 없습니다");
      return redirectToFrontend(false);
    }

    let me;
    try {
      me = await getUserMe(accessToken);
      console.log("카카오 사용자 정보 조회 성공:", me.id);
    } catch (e) {
      console.log("카카오 사용자 정보 조회 실패:", e.message);
      return redirectToFrontend(false);
    }

    let user;
    try {
      user = await upsertSocialUser({
        provider: "kakao",
        provider_id: me.id,
        name: me.nickname,
        profile_image_url: me.profile_image_url ?? "",
      });
      console.log("사용자 DB 저장 성공:", user.id);
    } catch (e) {
      console.log("사용자 DB 저장 실패:", e.message);
      return redirectToFrontend(false);
    }
    let appJwt;
    try {
      appJwt = signJwt(user);
      console.log("JWT 토큰 발급 성공");
    } catch (e) {
      console.log("JWT 토큰 발급 실패:", e.message);
      return redirectToFrontend(false);
    }

    console.log("카카오 로그인 완료, 프론트로 리다이렉트");
    return redirectToFrontend(true);
  },
});

module.exports = router;
