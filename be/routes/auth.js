const { Router } = require("express");
const { z } = require("zod");
const { success } = require("../utils/response");
const { upsertSocialUser } = require("../services/socialAuthService");
const { signJwt } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { BadRequestError } = require("../utils/ApiError");
const { getTokenInfo, getUserMe } = require("../services/kakaoAuthService");

const router = Router();

// 클라이언트가 액세스 토큰을 주고 provider_id를 얻는 게 정석이지만 지금은 프로토타입이라 직접 받는 방식으로 함요
const socialSchema = z.object({
  provider: z.enum(["google", "kakao"]),
  provider_id: z.string().min(1),
  name: z.string().min(1),
  profile_image_url: z.string().url().optional(),
});

router.post(
  "/social",
  asyncHandler(async (req, res) => {
    const parsed = socialSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(
        "유효하지 않은 입력입니다.",
        parsed.error.flatten()
      );
    }

    const user = upsertSocialUser(parsed.data);
    const token = signJwt(user);

    res.json(
      success(
        {
          user,
          token,
        },
        "social login ok"
      )
    );
  })
);

const kakaoLoginSchema = z.object({
  access_token: z.string().min(10),
});

router.post(
  "/kakao",
  asyncHandler(async (req, res) => {
    const { access_token } = kakaoLoginSchema.parse(req.body);

    const info = await getTokenInfo(access_token);
    const expectedAppId = process.env.KAKAO_APP_ID
      ? Number(process.env.KAKAO_APP_ID)
      : null;
    if (expectedAppId && info.app_id && expectedAppId !== info.app_id) {
      throw new BadRequestError("카카오 앱(app_id) 불일치");
    }

    const me = await getUserMe(access_token);

    const user = upsertSocialUser({
      provider: "kakao",
      provider_id: me.id,
      name: me.nickname,
      profile_image_url: me.profile_image_url,
    });
    const token = signJwt(user);

    return res.json(success({ user, token }, "kakao login ok"));
  })
);

module.exports = router;
