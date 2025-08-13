const jwt = require("jsonwebtoken");

function signJwt(user) {
  const payload = {
    sub: user.id,
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
    // 호환성: 기존 코드가 req.user.id를 참조할 수 있으므로 매핑 추가
    req.user = { id: decoded.sub };
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid token", code: 401 });
  }
}

module.exports = { signJwt, requireAuth };
