// Central error handler ensures uniform error responses across all endpoints.
// Format: { "error": { "message": "...", "code": "..." } }
export function errorHandler(err, req, res, next) {
  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: {
        message: "Malformed JSON payload.",
        code: "BAD_REQUEST",
      },
    });
  }

  // Fallback for Prisma unique constraint violation (code P2002)
  if (err.code === "P2002") {
    return res.status(409).json({
      error: {
        message: "A resource with these unique values already exists.",
        code: "CONFLICT",
      },
    });
  }

  // Fallback for Prisma record not found (code P2025)
  if (err.code === "P2025") {
    return res.status(404).json({
      error: {
        message: "The requested resource was not found.",
        code: "NOT_FOUND",
      },
    });
  }

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
