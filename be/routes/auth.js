const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { upsertSocialUser } = require("../services/socialAuthService");
const { signJwt } = require("../middlewares/auth");
const { getTokenInfo, getUserMe } = require("../services/kakaoAuthService");

const router = Router();

const SocialLoginReq = z.object({
  provider: z.enum(["kakao"]),
  access_token: z.string().min(1),
});

const SocialLoginRes = z.object({
  user: z.object({
    id: z.string(),
    provider: z.string(),
    provider_id: z.string(),
    name: z.string(),
    profile_image_url: z.string(),
  }),
  token: z.string(),
});

defineRoute(router, {
  method: "post",
  path: "/social",
  docPath: "/api/auth/social",
  summary: "소셜 로그인/회원가입",
  tags: ["Auth"],
  request: { body: SocialLoginReq },
  responses: {
    200: { description: "성공", body: SocialLoginRes },
    400: { description: "유효성 검증 실패" },
  },
  handler: async ({ body }) => {
    // 1) 액세스 토큰 유효성 검증
    await getTokenInfo(body.access_token);
    // 2) 사용자 정보 조회
    const me = await getUserMe(body.access_token);
    // 3) DB upsert
    const user = await upsertSocialUser({
      provider: body.provider,
      provider_id: me.id,
      name: me.nickname,
      profile_image_url: me.profile_image_url ?? "",
    });
    // 4) JWT 발급
    const token = signJwt(user);
    return { user, token };
  },
});

module.exports = router;
