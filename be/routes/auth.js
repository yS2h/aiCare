const { Router } = require("express");
const { z } = require("zod");
const { defineRoute } = require("../lib/route");
const { upsertSocialUser } = require("../services/socialAuthService");
const { signJwt } = require("../middlewares/auth");

const router = Router();

const SocialLoginReq = z.object({
  provider: z.enum(["kakao"]),
  provider_id: z.string(),
  name: z.string(),
  profile_image_url: z.string().optional(),
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
    const user = await upsertSocialUser({
      provider: body.provider,
      provider_id: body.provider_id,
      name: body.name,
      profile_image_url: body.profile_image_url ?? "",
    });
    const token = signJwt(user);
    return { user, token };
  },
});

module.exports = router;
