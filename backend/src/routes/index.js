import { Router } from "express";
import healthRoutes from "./health.routes.js";
import serviceRoutes from "./service.routes.js";
import incidentRoutes from "./incident.routes.js";
import statsRoutes from "./stats.routes.js";

const router = Router();

// Mount all v1 sub-routers
router.use("/health", healthRoutes);
router.use("/services", serviceRoutes);
router.use("/incidents", incidentRoutes);
router.use("/stats", statsRoutes);

export default router;
