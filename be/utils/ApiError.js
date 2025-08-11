class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = "Bad Request", details) {
    super(400, message, details);
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Not Found", details) {
    super(404, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", details) {
    super(401, message, details);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
};
