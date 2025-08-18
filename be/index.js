const express = require("express");
const cors = require("cors");
require("dotenv").config();

const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[ERROR] Required environment variable ${envVar} is not set`);
    process.exit(1);
  }
}

const { logger } = require("./middlewares/logger");
const { corsOptions } = require("./config/cors");
const { ApiError } = require("./utils/ApiError");
const { error: errorResponse } = require("./utils/response");
const { init: initDb, ping } = require("./providers/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(logger);
app.use(cors(corsOptions));

const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);

const healthRouter = require("./routes/health");
app.use("/api/health", healthRouter);

const versionRouter = require("./routes/version");
app.use("/api/version", versionRouter);

const meRouter = require("./routes/me");
app.use("/api/me", meRouter);

const childrenRouter = require("./routes/children");
app.use("/api/children", childrenRouter);

const swaggerUi = require("swagger-ui-express");
const { getOpenApiDocument } = require("./docs/openapi");

app.get("/openapi.json", (_, res) => res.json(getOpenApiDocument()));

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: "/openapi.json" },
  })
);

app.get("/", (req, res) => {
  res.send("초기 세팅 완료");
});

app.use((req, res, next) => {
  res.status(404).json(errorResponse("Not Found", 404));
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.message, err.statusCode, err.details));
  }

  const isProd = process.env.NODE_ENV === "production";
  const message = isProd
    ? "Internal Server Error"
    : err.message || "Internal Server Error";
  res.status(500).json(errorResponse(message, 500));
});

(async () => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await initDb();
      const pingResult = await ping();

      if (!pingResult) {
        throw new Error("Database ping failed");
      }

      console.log("[DB] init & ping OK");
      break;
    } catch (e) {
      retryCount++;
      console.error(
        `[DB] 초기화 실패 (시도 ${retryCount}/${maxRetries}):`,
        e.message
      );

      if (retryCount >= maxRetries) {
        console.error("[DB] 최대 재시도 횟수 초과. 서버를 종료합니다.");
        process.exit(1);
      }

      // 5초 후 재시도
      console.log(`[DB] 5초 후 재시도합니다...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
