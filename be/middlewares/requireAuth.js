const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer "))
      throw new ApiError(401, "Missing bearer token");

    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.sub) throw new ApiError(401, "Invalid token payload");

    req.user = { id: decoded.sub, ...decoded };
    next();
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
