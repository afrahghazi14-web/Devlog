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
