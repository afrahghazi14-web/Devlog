import * as healthService from "../services/health.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// Controllers receive HTTP requests, invoke services, and return HTTP responses.
export const getHealth = asyncHandler(async (req, res) => {
  const { isDatabaseUp } = await healthService.getHealthStatus();

  if (!isDatabaseUp) {
    return res.status(503).json({
      status: "error",
      database: "down",
    });
  }

  return res.status(200).json({
    status: "ok",
    database: "up",
  });
});
