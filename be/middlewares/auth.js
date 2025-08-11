const jwt = require("jsonwebtoken");

function signJwt(user) {
  const payload = {
    id: user.id,
    provider: user.provider,
    provider_id: user.provider_id,
    name: user.name,
    profile_image_url: user.profile_image_url,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "No token", code: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token", code: 401 });
  }
}

module.exports = { signJwt, requireAuth };
