const { Router } = require("express");
const { success } = require("../utils/response");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { BadRequestError } = require("../utils/ApiError");

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.query.fail === "1") {
      throw new BadRequestError("테스트용 잘못된 요청입니다", {
        hint: "fail=1",
      });
    }

    res.json(success({ version: "1.0.0", name: "aiCare API" }));
  })
);

module.exports = router;
