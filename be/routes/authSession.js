const express = require("express");
const router = express.Router();
const { cookieName, cookieOptions } = require("../config/session");

router.get("/me", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }

  const user = req.session.user
    ? {
        id: req.session.user.id,
        name: req.session.user.name,
        avatarUrl: req.session.user.avatarUrl,
        email: req.session.user.email,
      }
    : { id: req.session.userId };

  return res.json({ authenticated: true, user });
});

router.post("/logout", (req, res) => {
  const done = () => {
    res.clearCookie(cookieName, cookieOptions);
    return res.status(204).end();
  };

  if (!req.session) return done();

  req.session.destroy((err) => {
    if (err) {
      res.clearCookie(cookieName, cookieOptions);
      return res.status(500).json({ message: "Logout failed" });
    }
    return done();
  });
});

module.exports = router;
