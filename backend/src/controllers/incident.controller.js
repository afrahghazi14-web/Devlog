import * as incidentService from "../services/incident.service.js";

// Incident controller handles parsing HTTP request data, dispatching to incident service,
// and returning standardized HTTP response payloads.

export async function getIncidents(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await incidentService.listIncidents({ status, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;
    const incident = await incidentService.getIncidentById(id);
    return res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
}

export async function createIncident(req, res, next) {
  try {
    const { serviceId, title, description, severity } = req.body || {};
    const createdIncident = await incidentService.createIncident({
      serviceId,
      title,
      description,
      severity,
    });
    return res.status(201).json(createdIncident);
  } catch (error) {
    next(error);
  }
}
