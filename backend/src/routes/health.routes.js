import { Router } from "express";
import * as healthController from "../controllers/health.controller.js";

const router = Router();

// Map GET / to health controller
router.get("/", healthController.getHealth);

export default router;
