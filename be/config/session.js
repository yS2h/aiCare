const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

const isProd = process.env.NODE_ENV === "production";
const cookieName = process.env.COOKIE_NAME || "sid";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});

const cookieOptions = isProd
  ? {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: Number(process.env.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 7),
    }
  : {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: Number(process.env.COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 7),
    };

const sessionMiddleware = session({
  name: cookieName,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new pgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  cookie: cookieOptions,
});

module.exports = { sessionMiddleware, cookieName, cookieOptions };
