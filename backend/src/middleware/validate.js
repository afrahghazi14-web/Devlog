import { AppError } from "../errors/AppError.js";

// Reusable validation helper functions written from scratch (no third-party library)
export function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

export function isPositiveInteger(val) {
  if (val === undefined || val === null || val === "") return false;
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
}

export function isValidEnum(val, allowedValues) {
  return allowedValues.includes(val);
}

// Allowed enumeration values defined in prisma/schema.prisma
const ALLOWED_ENVIRONMENTS = ["PRODUCTION", "STAGING", "QA"];
const ALLOWED_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const ALLOWED_STATUSES = ["ALL", "OPEN", "RESOLVED"];

export function validateCreateService(req, res, next) {
  const problems = [];
  const { name, environment } = req.body || {};

  if (!isNonEmptyString(name)) {
    problems.push("Service name is required and cannot be empty.");
  } else if (name.trim().length > 100) {
    problems.push("Service name must not exceed 100 characters.");
  }

  if (!environment || !isValidEnum(environment, ALLOWED_ENVIRONMENTS)) {
    problems.push(
      `Environment is required and must be one of: ${ALLOWED_ENVIRONMENTS.join(", ")}.`
    );
  }

  if (problems.length > 0) {
    return next(new AppError(problems.join("; "), 400, "BAD_REQUEST", problems));
  }

  req.body.name = name.trim();
  next();
}

export function validateCreateIncident(req, res, next) {
  const problems = [];
  const { serviceId, title, description, severity } = req.body || {};

  if (!isPositiveInteger(serviceId)) {
    problems.push("A valid positive integer serviceId is required.");
  }

  if (!isNonEmptyString(title)) {
    problems.push("Incident title is required and cannot be empty.");
  } else if (title.trim().length > 200) {
    problems.push("Incident title must not exceed 200 characters.");
  }

  if (!isNonEmptyString(description)) {
    problems.push("Incident description is required and cannot be empty.");
  } else if (description.trim().length > 2000) {
    problems.push("Incident description must not exceed 2000 characters.");
  }

  if (!severity || !isValidEnum(severity, ALLOWED_SEVERITIES)) {
    problems.push(
      `Severity is required and must be one of: ${ALLOWED_SEVERITIES.join(", ")}.`
    );
  }

  if (problems.length > 0) {
    return next(new AppError(problems.join("; "), 400, "BAD_REQUEST", problems));
  }

  req.body.serviceId = parseInt(serviceId, 10);
  req.body.title = title.trim();
  req.body.description = description.trim();
  next();
}

export function validateResolveIncident(req, res, next) {
  const problems = [];
  const { id } = req.params;
  const { rootCause, resolutionSteps, timeSpentMinutes } = req.body || {};

  if (!isPositiveInteger(id)) {
    problems.push("Incident ID must be a positive integer.");
  }

  if (!isNonEmptyString(rootCause)) {
    problems.push("Root cause is required and cannot be empty.");
  } else if (rootCause.trim().length > 2000) {
    problems.push("Root cause must not exceed 2000 characters.");
  }

  if (!isNonEmptyString(resolutionSteps)) {
    problems.push("Resolution steps are required and cannot be empty.");
  } else if (resolutionSteps.trim().length > 2000) {
    problems.push("Resolution steps must not exceed 2000 characters.");
  }

  if (!isPositiveInteger(timeSpentMinutes)) {
    problems.push("timeSpentMinutes must be a positive integer.");
  } else if (Number(timeSpentMinutes) > 525600) {
    problems.push("timeSpentMinutes cannot exceed 525600 (one year).");
  }

  if (problems.length > 0) {
    return next(new AppError(problems.join("; "), 400, "BAD_REQUEST", problems));
  }

  req.body.rootCause = rootCause.trim();
  req.body.resolutionSteps = resolutionSteps.trim();
  req.body.timeSpentMinutes = parseInt(timeSpentMinutes, 10);
  next();
}

export function validateGetIncidentsQuery(req, res, next) {
  const problems = [];
  const { status, page, limit } = req.query;

  if (status !== undefined) {
    const normalized = typeof status === "string" ? status.trim().toUpperCase() : "";
    if (!isValidEnum(normalized, ALLOWED_STATUSES)) {
      problems.push(
        `Invalid status '${status}'. Allowed values: ${ALLOWED_STATUSES.join(", ")}.`
      );
    }
  }

  if (page !== undefined && !isPositiveInteger(page)) {
    problems.push("page must be an integer greater than or equal to 1.");
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
      problems.push("limit must be an integer between 1 and 50.");
    }
  }

  if (problems.length > 0) {
    return next(new AppError(problems.join("; "), 400, "BAD_REQUEST", problems));
  }

  next();
}
