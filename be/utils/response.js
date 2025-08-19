function isExpressResponse(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.setHeader === "function" &&
    typeof obj.json === "function"
  );
}

function success(arg1, arg2, arg3) {
  let data = arg1;
  let message = arg2 ?? null;

  if (isExpressResponse(arg1)) {
    data = arg2;
    message = arg3 ?? null;
  }

  return {
    success: true,
    message: message ?? null,
    data: data ?? null,
  };
}

function error(arg1, arg2, arg3) {
  let statusCode = typeof arg1 === "number" ? arg1 : 500;
  let message =
    typeof arg1 === "string" ? arg1 : (arg2 ?? "Internal Server Error");
  let details = (typeof arg1 === "number" ? arg3 : arg2) ?? null;

  if (isExpressResponse(arg1)) {
    statusCode = typeof arg2 === "number" ? arg2 : 500;
    message = typeof arg3 === "string" ? arg3 : "Internal Server Error";
    details = null;
  }

  return {
    success: false,
    statusCode,
    message,
    details,
  };
}

module.exports = { success, error };
