import { Router } from "express";
import * as serviceController from "../controllers/service.controller.js";
import { validateCreateService } from "../middleware/validate.js";

const router = Router();

// Routes strictly map HTTP method and path to controller handlers
router.get("/", serviceController.getServices);
router.post("/", validateCreateService, serviceController.createService);

export default router;
