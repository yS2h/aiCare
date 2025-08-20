const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");

function requireAuth(req, res, next) {
  try {
    const sessionUserId = req.session?.user?.id || req.session?.userId;
    if (sessionUserId) {
      req.user = req.session.user || { id: sessionUserId };
      return next();
    }

    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7).trim();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.sub || decoded?.id;
      if (!userId) throw new ApiError(401, "Invalid token payload");
      req.user = { id: userId, ...decoded };
      return next();
    }

    throw new ApiError(401, "Unauthorized");
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(new ApiError(401, "Token expired"));
    if (err.name === "JsonWebTokenError")
      return next(new ApiError(401, "Invalid token"));
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Unauthorized"));
  }
}

module.exports = { requireAuth };
