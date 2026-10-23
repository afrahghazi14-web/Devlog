import * as statsService from "../services/stats.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// Controller for dashboard metrics and summary stats
export const getStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getStats();
  res.status(200).json(stats);
});
