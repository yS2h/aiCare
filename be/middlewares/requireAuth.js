const { error: errorResponse } = require("../utils/response");

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();

  return res.status(401).json(
    errorResponse("Unauthorized", 401, {
      reason: "NO_SESSION",
    })
  );
}

module.exports = { requireAuth };
