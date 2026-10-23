import { prisma } from "../config/db.js";

// Repositories isolate Prisma queries from business logic.
// All database queries for incidents live here.

export async function findManyWithCount({ where, skip, take, orderBy }) {
  // We use prisma.$transaction to execute the paginated list and the count atomically.
  // Including 'service' ensures the related service data is fetched without an N+1 query.
  const [data, total] = await prisma.$transaction([
    prisma.incident.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        service: true,
      },
    }),
    prisma.incident.count({ where }),
  ]);

  return { data, total };
}

export async function findById(id) {
  // Fetch an incident along with its associated service and optional post-mortem
  return prisma.incident.findUnique({
    where: { id },
    include: {
      service: true,
      postMortem: true,
    },
  });
}

export async function create(data) {
  // Insert a new incident and immediately return it with its associated service record
  return prisma.incident.create({
    data,
    include: {
      service: true,
    },
  });
}
