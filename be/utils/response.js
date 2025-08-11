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

module.exports = { success, error };
