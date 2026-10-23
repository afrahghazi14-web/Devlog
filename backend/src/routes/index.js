import { Router } from "express";
import healthRoutes from "./health.routes.js";

const router = Router();

// Mount all v1 sub-routers
router.use("/health", healthRoutes);

export default router;
