import { Router } from "express";
import * as incidentController from "../controllers/incident.controller.js";
import {
  validateCreateIncident,
  validateResolveIncident,
  validateGetIncidentsQuery,
} from "../middleware/validate.js";

const router = Router();

// Routes strictly map HTTP method and path to controller handlers with validation middleware
router.get("/", validateGetIncidentsQuery, incidentController.getIncidents);
router.get("/:id", incidentController.getIncidentById);
router.post("/", validateCreateIncident, incidentController.createIncident);
router.post("/:id/resolve", validateResolveIncident, incidentController.resolveIncident);

export default router;
