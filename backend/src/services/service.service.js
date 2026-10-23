import * as serviceRepository from "../repositories/service.repository.js";
import { AppError } from "../errors/AppError.js";

// Valid environment values defined in schema.prisma
const VALID_ENVIRONMENTS = ["PRODUCTION", "STAGING", "QA"];

export async function listServices() {
  return serviceRepository.findAll();
}

export async function createService({ name, environment }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new AppError("Service name is required.", 400, "BAD_REQUEST");
  }

  if (!environment || !VALID_ENVIRONMENTS.includes(environment)) {
    throw new AppError(
      `Invalid environment '${environment}'. Allowed values: ${VALID_ENVIRONMENTS.join(", ")}.`,
      400,
      "BAD_REQUEST"
    );
  }

  const trimmedName = name.trim();

  // Business rule: A service name must be unique within an environment
  const existingService = await serviceRepository.findByNameAndEnvironment(
    trimmedName,
    environment
  );

  if (existingService) {
    throw new AppError(
      `Service '${trimmedName}' already exists in the '${environment}' environment.`,
      409,
      "CONFLICT"
    );
  }

  return serviceRepository.create({
    name: trimmedName,
    environment,
  });
}
