import * as serviceService from "../services/service.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// Controllers receive HTTP requests, invoke services, and respond.
export const getServices = asyncHandler(async (req, res) => {
  const services = await serviceService.listServices();
  res.status(200).json(services);
});

export const createService = asyncHandler(async (req, res) => {
  const { name, environment } = req.body || {};
  const newService = await serviceService.createService({ name, environment });
  res.status(201).json(newService);
});
