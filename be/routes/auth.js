const { Router } = require("express");
const { z } = require("zod");
const { success } = require("../utils/response");
const { upsertSocialUser } = require("../services/socialAuthService");
const { signJwt } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/asyncHandler");
const router = Router();

router.post(
  "/social",
  asyncHandler(async (req, res) => {
    const user = await upsertSocialUser({
      provider: req.body.provider,
      provider_id: req.body.provider_id,
      name: req.body.name,
      profile_image_url: req.body.profile_image_url,
    });
    const token = signJwt(user);
    return res.json(success({ user, token }, "social login ok"));
  })
);

router.post(
  "/kakao",
  asyncHandler(async (req, res) => {
    const user = await upsertSocialUser({
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
