import { prisma } from "../config/db.js";

// Repositories are the only layer allowed to communicate directly with the database.
// This isolates data access details and makes the service layer easy to test or refactor.

export async function findAll() {
  // Return all services sorted alphabetically by name for a clean UI presentation
  return prisma.service.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function findById(id) {
  // Find a specific service by its primary key
  return prisma.service.findUnique({
    where: { id },
  });
}

export async function findByNameAndEnvironment(name, environment) {
  // The schema defines a composite unique constraint @@unique([name, environment]).
  // Prisma generates the compound key accessor 'name_environment'.
  return prisma.service.findUnique({
    where: {
      name_environment: {
        name,
        environment,
      },
    },
  });
}

export async function create(data) {
  // Insert a new service record into the database
  return prisma.service.create({
    data,
  });
}
