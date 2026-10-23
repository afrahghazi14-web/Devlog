import * as incidentRepository from "../repositories/incident.repository.js";
import * as serviceRepository from "../repositories/service.repository.js";

const VALID_STATUSES = ["ALL", "OPEN", "RESOLVED"];
const VALID_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function listIncidents({ status = "ALL", page = 1, limit = 10 } = {}) {
  // Normalize and validate status query filter
  const normalizedStatus = (typeof status === "string" ? status.trim().toUpperCase() : "ALL");
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    const error = new Error(
      `Invalid status '${status}'. Allowed values: ${VALID_STATUSES.join(", ")}.`
    );
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Sanitize page number: integer >= 1
  let pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = 1;
  }

  // Sanitize limit: integer between 1 and 50
  let limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1) {
    limitNum = 10;
  } else if (limitNum > 50) {
    limitNum = 50;
  }

  // Build where filter: only filter by status if not "ALL"
  const where = {};
  if (normalizedStatus !== "ALL") {
    where.status = normalizedStatus;
  }

  // Offset pagination: skip calculated from page and limit
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  // Newest incidents first
  const orderBy = {
    createdAt: "desc",
  };

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
    const error = new Error(`Incident not found with id ${id}.`);
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const incident = await incidentRepository.findById(incidentId);
  if (!incident) {
    const error = new Error(`Incident not found with id ${id}.`);
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return incident;
}

export async function createIncident({ serviceId, title, description, severity }) {
  // Validate serviceId input format
  const parsedServiceId = parseInt(serviceId, 10);
  if (!serviceId || isNaN(parsedServiceId) || parsedServiceId <= 0) {
    const error = new Error("A valid serviceId is required.");
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Validate title
  if (!title || typeof title !== "string" || !title.trim()) {
    const error = new Error("Incident title is required.");
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Validate description
  if (!description || typeof description !== "string" || !description.trim()) {
    const error = new Error("Incident description is required.");
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Validate severity
  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    const error = new Error(
      `Invalid severity '${severity}'. Allowed values: ${VALID_SEVERITIES.join(", ")}.`
    );
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Business Rule: The referenced service must exist before logging an incident
  const service = await serviceRepository.findById(parsedServiceId);
  if (!service) {
    const error = new Error(`Service not found with id ${parsedServiceId}.`);
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  // Create incident with initial status OPEN
  return incidentRepository.create({
    serviceId: parsedServiceId,
    title: title.trim(),
    description: description.trim(),
    severity,
    status: "OPEN",
  });
}
