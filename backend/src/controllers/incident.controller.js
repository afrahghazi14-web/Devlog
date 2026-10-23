import * as incidentService from "../services/incident.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// Controllers receive HTTP requests, dispatch to services, and send HTTP responses.
// Using asyncHandler avoids repetitive try/catch boilerplate.

export const getIncidents = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await incidentService.listIncidents({ status, page, limit });
  res.status(200).json(result);
});

export const getIncidentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const incident = await incidentService.getIncidentById(id);
  res.status(200).json(incident);
});

export const createIncident = asyncHandler(async (req, res) => {
  const { serviceId, title, description, severity } = req.body;
  const createdIncident = await incidentService.createIncident({
    serviceId,
    title,
    description,
    severity,
  });
  res.status(201).json(createdIncident);
});

export const resolveIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rootCause, resolutionSteps, timeSpentMinutes } = req.body;
  const resolved = await incidentService.resolveIncident(id, {
    rootCause,
    resolutionSteps,
    timeSpentMinutes,
  });
  res.status(201).json(resolved);
});
