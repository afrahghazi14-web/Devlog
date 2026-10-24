import { prisma } from "../config/db.js";

// Repositories are the only layer allowed to communicate with Prisma directly.

export async function getStats() {
  // Execute aggregation and counting queries concurrently
  const [openIncidents, openHighSeverity, totalMinutesResult] = await Promise.all([
    // Total number of incidents that are currently OPEN
    prisma.incident.count({
      where: {
        status: "OPEN",
      },
    }),
    // OPEN incidents with HIGH or CRITICAL severity
    prisma.incident.count({
      where: {
        status: "OPEN",
        severity: {
          in: ["HIGH", "CRITICAL"],
        },
      },
    }),
    // Sum of resolution time spent across all post-mortems
    prisma.postMortem.aggregate({
      _sum: {
        timeSpentMinutes: true,
      },
    }),
  ]);

  // If there are no post-mortems yet, _sum.timeSpentMinutes returns null; default to 0
  const totalMinutesSpent = totalMinutesResult._sum.timeSpentMinutes || 0;

  return {
    openIncidents,
    openHighSeverity,
    totalMinutesSpent,
  };
}

// Analytics query using prisma.$queryRaw tagged template with a CTE and window function.
// Returns incident counts, resolution times, and service rank by total resolution duration.
export async function getServiceStats() {
  const result = await prisma.$queryRaw`
    WITH service_metrics AS (
      SELECT
        s.id,
        s.name,
        s.environment,
        CAST(COUNT(i.id) AS INTEGER) AS "incidentCount",
        CAST(COUNT(CASE WHEN i.status = 'RESOLVED' THEN 1 END) AS INTEGER) AS "resolvedCount",
        CAST(COALESCE(SUM(pm."timeSpentMinutes"), 0) AS INTEGER) AS "totalMinutesSpent",
        ROUND(
          COALESCE(
            AVG(CASE WHEN i.status = 'RESOLVED' THEN pm."timeSpentMinutes" END),
            0
          )::NUMERIC,
          1
        )::FLOAT AS "avgMinutesPerResolved"
      FROM "Service" s
      LEFT JOIN "Incident" i ON s.id = i."serviceId"
      LEFT JOIN "PostMortem" pm ON i.id = pm."incidentId"
      GROUP BY s.id, s.name, s.environment
    )
    SELECT
      id,
      name,
      environment,
      "incidentCount",
      "resolvedCount",
      "totalMinutesSpent",
      "avgMinutesPerResolved",
      RANK() OVER (ORDER BY "totalMinutesSpent" DESC)::INTEGER AS rank
    FROM service_metrics
    ORDER BY rank ASC, name ASC;
  `;

  return result;
}

