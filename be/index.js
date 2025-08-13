const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

// DB 준비가 완료된 이후에만 서버를 시작한다
(async () => {
  try {
    await initDb();
    await ping();
    console.log("[DB] init & ping OK");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("[DB] 초기화 실패:", e);
    process.exit(1);
  }
})();
