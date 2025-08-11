const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { logger } = require("./middlewares/logger");
const { corsOptions } = require("./config/cors");
const { ApiError } = require("./utils/ApiError");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(logger);
app.use(cors(corsOptions));

const healthRouter = require("./routes/health");
app.use("/api/health", healthRouter);
const versionRouter = require("./routes/version");
app.use("/api/version", versionRouter);
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);
const meRouter = require("./routes/me");
app.use("/api/me", meRouter);

app.get("/", (req, res) => {
  res.send("초기 세팅 완료");
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.statusCode,
      details: err.details,
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: 500,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
