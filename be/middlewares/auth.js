const jwt = require("jsonwebtoken");
const { requireAuth } = require("./requireAuth");

function signJwt(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  const payload = { sub: user.id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

module.exports = { requireAuth, signJwt };
