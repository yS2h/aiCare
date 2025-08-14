function success(data = null, message = "success") {
  return {
    success: true,
    message,
    data,
  };
}

function error(message = "error", code = 500, details = null) {
  return {
    success: false,
    message,
    code,
    details,
  };
}

function authError(message, code = 401) {
  return {
    success: false,
    message,
    code,
  };
}

module.exports = { success, error, authError };
