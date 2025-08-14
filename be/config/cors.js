const parseOrigins = () => {
  const raw = process.env.CORS_ORIGINS || "";
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const allowedOrigins = new Set(parseOrigins());

const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV === "production" && !origin) {
      return callback(new Error("Origin is required in production"), false);
    }

    if (!origin && process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

module.exports = { corsOptions };
