import * as incidentRepository from "../repositories/incident.repository.js";
import * as serviceRepository from "../repositories/service.repository.js";
import { AppError } from "../errors/AppError.js";

const VALID_STATUSES = ["ALL", "OPEN", "RESOLVED"];
const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function listIncidents({ status = "ALL", page = 1, limit = 10 } = {}) {
  // Normalize status query filter
  const normalizedStatus = (typeof status === "string" ? status.trim().toUpperCase() : "ALL");
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    throw new AppError(
      `Invalid status '${status}'. Allowed values: ${VALID_STATUSES.join(", ")}.`,
      400,
      "BAD_REQUEST"
    );
  }

  let pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = 1;
  }

  let limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1) {
    limitNum = 10;
  } else if (limitNum > 50) {
    limitNum = 50;
  }

  const where = {};
  if (normalizedStatus !== "ALL") {
    where.status = normalizedStatus;
  }

  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;
  const orderBy = { createdAt: "desc" };

  const { data, total } = await incidentRepository.findManyWithCount({
    where,
    skip,
    take,
    orderBy,
  });

  const totalPages = Math.ceil(total / limitNum);

  return {
    data,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  };
}

export async function getIncidentById(id) {
  const incidentId = parseInt(id, 10);
  if (isNaN(incidentId) || incidentId <= 0) {
    throw new AppError(`Incident not found with id ${id}.`, 404, "NOT_FOUND");
  }

  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    throw new AppError(`Incident not found with id ${id}.`, 404, "NOT_FOUND");
  }

  return incident;
}

export async function createIncident({ serviceId, title, description, severity }) {
  const parsedServiceId = parseInt(serviceId, 10);
  if (!serviceId || isNaN(parsedServiceId) || parsedServiceId <= 0) {
    throw new AppError("A valid serviceId is required.", 400, "BAD_REQUEST");
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new AppError("Incident title is required.", 400, "BAD_REQUEST");
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    throw new AppError("Incident description is required.", 400, "BAD_REQUEST");
  }

  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    throw new AppError(
      `Invalid severity '${severity}'. Allowed values: ${VALID_SEVERITIES.join(", ")}.`,
      400,
      "BAD_REQUEST"
    );
  }

  // Business Rule: The referenced service must exist before logging an incident
  const service = await serviceRepository.findById(parsedServiceId);
  if (!service) {
    throw new AppError(`Service not found with id ${parsedServiceId}.`, 404, "NOT_FOUND");
  }

  return incidentRepository.create({
    serviceId: parsedServiceId,
    title: title.trim(),
    description: description.trim(),
    severity,
    status: "OPEN",
  });
}

export async function resolveIncident(
  id,
  { rootCause, resolutionSteps, timeSpentMinutes }
) {
  const incidentId = parseInt(id, 10);
  if (isNaN(incidentId) || incidentId <= 0) {
    throw new AppError(`Incident not found with id ${id}.`, 404, "NOT_FOUND");
  }

  // Execute the atomic resolve transaction in the repository layer
  const result = await incidentRepository.executeResolveTransaction(incidentId, {
    rootCause,
    resolutionSteps,
    timeSpentMinutes,
  });

  // Business rules: handle missing incident vs. already resolved conflict
  if (!result.success) {
    if (result.notFound) {
      throw new AppError(`Incident not found with id ${incidentId}.`, 404, "NOT_FOUND");
    }
    throw new AppError(
      `Incident with id ${incidentId} is already resolved.`,
      409,
      "CONFLICT"
    );
  }

  return result.incident;
}
