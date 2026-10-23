import * as serviceService from "../services/service.service.js";

// Controllers handle HTTP requests, extract parameters/body, invoke services, and respond.
// They contain NO database logic.

export async function getServices(req, res, next) {
  try {
    const services = await serviceService.listServices();
    return res.status(200).json(services);
  } catch (error) {
    next(error);
  }
}

export async function createService(req, res, next) {
  try {
    const { name, environment } = req.body || {};
    const newService = await serviceService.createService({ name, environment });
    return res.status(201).json(newService);
  } catch (error) {
    next(error);
  }
}
