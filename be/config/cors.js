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
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

module.exports = { corsOptions };
