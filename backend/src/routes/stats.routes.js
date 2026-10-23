import { Router } from "express";
import * as statsController from "../controllers/stats.controller.js";

const router = Router();

// GET /api/v1/stats
router.get("/", statsController.getStats);

export default router;
