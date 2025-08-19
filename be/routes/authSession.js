const express = require("express");
const router = express.Router();

const { cookieName, cookieOptions } = require("../config/session");
const { defineRoute } = require("../lib/route");

defineRoute(router, {
  method: "get",
  path: "/me",
  docPath: "/api/auth/me",
  summary: "세션 상태 조회",
  tags: ["Auth"],
  responses: {
    200: { description: "로그인 상태" },
    401: { description: "미인증" },
  },
  handler: async (_ctx, req, res) => {
    const sessionUserId = req.session?.user?.id || req.session?.userId;
    if (!sessionUserId) {
      return res.status(401).json({ authenticated: false });
    }
    const user = req.session.user || { id: sessionUserId };
    return res.json({ authenticated: true, user });
  },
});

defineRoute(router, {
  method: "post",
  path: "/logout",
  docPath: "/api/auth/logout",
  summary: "로그아웃 (세션 파기)",
  tags: ["Auth"],
  responses: {
    204: { description: "성공" },
    500: { description: "스토어 에러" },
  },
  handler: async (_ctx, req, res) => {
    const done = () => {
      res.clearCookie(cookieName, cookieOptions);
      return res.status(204).end();
    };
    if (!req.session) return done();

    req.session.destroy((err) => {
      res.clearCookie(cookieName, cookieOptions);
      if (err) return res.status(500).json({ message: "Logout failed" });
      return done();
    });
  },
});

module.exports = router;
