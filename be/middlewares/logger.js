const morgan = require("morgan");

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

const skip =
  process.env.NODE_ENV === "production"
    ? (req, res) => res.statusCode < 400
    : false;

const logger = morgan(format, { skip });

module.exports = { logger };
