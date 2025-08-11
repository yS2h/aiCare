const morgan = require("morgan");

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";

const logger = morgan(format);

module.exports = { logger };
