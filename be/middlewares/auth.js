const jwt = require("jsonwebtoken");
const { authError } = require("../utils/response");

function signJwt(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const payload = {
    sub: user.id,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

function requireAuth(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json(authError("Server configuration error", 500));
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json(authError("No token", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json(authError("Invalid token", 401));
  }
}

module.exports = { signJwt, requireAuth };
