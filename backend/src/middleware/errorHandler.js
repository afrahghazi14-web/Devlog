// Central error handler ensures uniform error responses across all endpoints.
// Format: { "error": { "message": "...", "code": "..." } }
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "An unexpected error occurred.";

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Malformed JSON payload.";
  }

  // Handle payload size exceeding 100kb
  if (err.type === "entity.too.large") {
    statusCode = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body exceeds the 100kb limit.";
  }

  // Prisma Error Mapping:
  // P2002 -> 409 (Unique constraint violation)
  // P2025 -> 404 (Record not found)
  // P2003 -> 400 (Foreign key constraint violation)
  if (err.code === "P2002") {
    statusCode = 409;
    code = "CONFLICT";
    message = "A resource with these unique values already exists.";
  } else if (err.code === "P2025") {
    statusCode = 404;
    code = "NOT_FOUND";
    message = "The requested resource was not found.";
  } else if (err.code === "P2003") {
    statusCode = 400;
    code = "BAD_REQUEST";
    message = "Foreign key constraint failed.";
  }

  // Unexpected errors return 500 with a generic message.
  // Log the details on the server; never send stack traces to the client.
  if (statusCode >= 500) {
    console.error(`[Server Error] ${new Date().toISOString()}:`, err);
    statusCode = 500;
    code = "INTERNAL_SERVER_ERROR";
    message = "An unexpected internal server error occurred.";
  }

  const response = {
    error: {
      message,
      code,
    },
  };

  if (err.details && Array.isArray(err.details)) {
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
}
