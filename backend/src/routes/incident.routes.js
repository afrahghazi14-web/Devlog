import { Router } from "express";
import * as incidentController from "../controllers/incident.controller.js";

const router = Router();

// Routes strictly map HTTP method and path to controller handlers
router.get("/", incidentController.getIncidents);
router.get("/:id", incidentController.getIncidentById);
router.post("/", incidentController.createIncident);

export default router;
