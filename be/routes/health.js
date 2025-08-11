const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "aiCare-be",
    time: new Date().toISOString(),
  });
});

module.exports = router;
