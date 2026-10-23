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

export async function executeResolveTransaction(
  incidentId,
  { rootCause, resolutionSteps, timeSpentMinutes }
) {
  // Execute the incident status update and post-mortem creation inside ONE single transaction.
  // If either step fails, the entire transaction automatically rolls back.
  return prisma.$transaction(async (tx) => {
    // To prevent race conditions from concurrent resolve requests, update conditionally
    // on status = 'OPEN'. This uses row locking in PostgreSQL without a preliminary read check.
    const updateResult = await tx.incident.updateMany({
      where: {
        id: incidentId,
        status: "OPEN",
      },
      data: {
        status: "RESOLVED",
      },
    });

    // If no rows were updated, check whether the incident was non-existent or already resolved
    if (updateResult.count === 0) {
      const existing = await tx.incident.findUnique({
        where: { id: incidentId },
        select: { id: true, status: true },
      });

      return {
        success: false,
        notFound: !existing,
      };
    }

    // Insert post-mortem record linked to this incident
    await tx.postMortem.create({
      data: {
        incidentId,
        rootCause,
        resolutionSteps,
        timeSpentMinutes,
      },
    });

    // Return the updated incident with its service and postMortem
    const incident = await tx.incident.findUnique({
      where: { id: incidentId },
      include: {
        service: true,
        postMortem: true,
      },
    });

    return {
      success: true,
      incident,
    };
  });
}
