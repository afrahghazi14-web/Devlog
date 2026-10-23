import * as healthService from "../services/health.service.js";

// Controllers receive HTTP requests, invoke services, and return HTTP responses.
export async function getHealth(req, res, next) {
  try {
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
  } catch (error) {
    next(error);
  }
}
