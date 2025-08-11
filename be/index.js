const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { logger } = require("./middlewares/logger");
const { corsOptions } = require("./config/cors");
const { ApiError } = require("./utils/ApiError");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());

const healthRouter = require("./routes/health"); // 새로 만들 파일
app.use("/api/health", healthRouter);
const versionRouter = require("./routes/version");
app.use("/api/version", versionRouter);

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
