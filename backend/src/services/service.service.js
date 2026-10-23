import * as serviceRepository from "../repositories/service.repository.js";

// Valid environment values defined in schema.prisma
const VALID_ENVIRONMENTS = ["PRODUCTION", "STAGING", "QA"];

export async function listServices() {
  return serviceRepository.findAll();
}

export async function createService({ name, environment }) {
  // Validate presence and type of name
  if (!name || typeof name !== "string" || !name.trim()) {
    const error = new Error("Service name is required.");
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  // Validate environment against allowed enum values
  if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
    const error = new Error(
      `Invalid environment '${environment}'. Allowed values: ${VALID_ENVIRONMENTS.join(", ")}.`
    );
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  const trimmedName = name.trim();

  // Business rule: A service name must be unique within an environment
  const existingService = await serviceRepository.findByNameAndEnvironment(
    trimmedName,
    environment
  );

  if (existingService) {
    const error = new Error(
      `Service '${trimmedName}' already exists in the '${environment}' environment.`
    );
    error.statusCode = 409;
    error.code = "CONFLICT";
    throw error;
  }

  return serviceRepository.create({
    name: trimmedName,
    environment,
  });
}
