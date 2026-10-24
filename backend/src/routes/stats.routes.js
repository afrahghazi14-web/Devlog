import { Router } from "express";
import * as statsController from "../controllers/stats.controller.js";

const router = Router();

// GET /api/v1/stats
router.get("/", statsController.getStats);

// GET /api/v1/stats/services (Analytics: incident counts, time spent, rank by duration)
router.get("/services", statsController.getServiceStats);

export default router;

