// Central error handler ensures uniform error responses across all endpoints.
// Format: { "error": { "message": "...", "code": "..." } }
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    error: {
      message,
      code,
    },
  });
}
