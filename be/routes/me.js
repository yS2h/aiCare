const { Router } = require("express");
const { requireAuth } = require("../middlewares/auth");
const { success } = require("../utils/response");

const router = Router();
router.get("/", requireAuth, (req, res) => {
  res.json(success({ me: req.user }));
});
module.exports = router;
