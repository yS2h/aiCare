const { Router } = require("express");
const { success } = require("../utils/response");

const router = Router();

router.get("/", (req, res) => {
  res.json(success({ version: "1.0.0", name: "aiCare API" }));
});

module.exports = router;
