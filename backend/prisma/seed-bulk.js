import { prisma } from "../src/config/db.js";

// Bulk seed script for performance benchmarking and EXPLAIN ANALYZE measurements.
// Inserts ~20,000 incidents (~5% OPEN, ~95% RESOLVED with post-mortems) spread
// across available services with realistic timestamps over the preceding 365 days.

const TITLES = [
  "Database connection pool exhaustion during peak throughput",
  "Elevated 5xx error rate on internal RPC endpoint",
  "Stale cache entry causing data inconsistency on updated entities",
  "High memory utilization on worker instances exceeding 90% threshold",
  "CPU spike following periodic batch synchronization job",
  "SSL handshake latency on outbound payment gateway gateway",
  "Queue backlog accumulation in async notification worker",
  "Disk I/O latency spike impacting database query responsiveness",
  "Network packet drop between service mesh container proxies",
  "Slow query execution on unindexed foreign key relation",
  "Downstream identity provider token validation timeout",
  "Memory leak in session cleanup background worker loop",
  "Worker thread deadlock during heavy concurrent requests",
  "Cache eviction storm causing sudden database read spike",
  "Upstream webhook delivery failure due to expired TLS certificate",
];

const ROOT_CAUSES = [
  "Connection leak in unclosed transaction block during timeout handler execution.",
  "Missing compound index on frequently queried foreign key column causing sequential scan.",
  "Worker queue consumer concurrency reached thread exhaustion under burst traffic.",
  "Garbage collection pause triggered by excessive heap allocation in JSON payload parser.",
  "TCP socket descriptors exhausted due to missing keep-alive reuse configuration.",
  "Resource contention on shared database lock during bulk update operations.",
];

const RESOLUTION_STEPS = [
  "Increased connection pool size, added connection timeout guard, and restarted pods.",
  "Created partial btree index, updated query planner statistics with ANALYZE.",
  "Scaled out worker replica count from 3 to 8 and tuned prefetch queue limits.",
  "Optimized JSON streaming parser to reduce transient allocations and memory pressure.",
  "Configured TCP keep-alive sockets and enabled client-side connection pooling.",
  "Restructured updates into smaller batches with explicit deadlock retry logic.",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🚀 Starting bulk data generation (~20,000 incidents)...");
  const startTime = Date.now();

  // Ensure services exist
  let services = await prisma.service.findMany();
  if (services.length === 0) {
    console.log("No services found, seeding baseline services first...");
    services = await Promise.all([
      prisma.service.create({ data: { name: "User Auth", environment: "PRODUCTION" } }),
      prisma.service.create({ data: { name: "Billing Engine", environment: "PRODUCTION" } }),
      prisma.service.create({ data: { name: "Notification API", environment: "STAGING" } }),
      prisma.service.create({ data: { name: "Search Indexer", environment: "PRODUCTION" } }),
      prisma.service.create({ data: { name: "Analytics Collector", environment: "QA" } }),
    ]);
  }

  const serviceIds = services.map((s) => s.id);
  const TOTAL_INCIDENTS = 20000;
  const BATCH_SIZE = 2500;
  const numBatches = Math.ceil(TOTAL_INCIDENTS / BATCH_SIZE);

  const nowMs = Date.now();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  let totalOpen = 0;
  let totalResolved = 0;

  for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL_INCIDENTS - batchIdx * BATCH_SIZE);
    const incidentRecords = [];

    for (let i = 0; i < batchCount; i++) {
      // 5% OPEN, 95% RESOLVED
      const isOpen = Math.random() < 0.05;
      if (isOpen) totalOpen++;
      else totalResolved++;

      // Random createdAt within the past 365 days
      const createdAt = new Date(nowMs - Math.floor(Math.random() * oneYearMs));

      incidentRecords.push({
        serviceId: randomChoice(serviceIds),
        title: randomChoice(TITLES),
        description: `Automated incident log generated during synthetic workload run. Monitored service disruption.`,
        severity: randomChoice(SEVERITIES),
        status: isOpen ? "OPEN" : "RESOLVED",
        createdAt,
      });
    }

    // Insert incidents batch and retrieve generated IDs
    const insertedIncidents = await prisma.incident.createManyAndReturn({
      data: incidentRecords,
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    // Prepare post-mortems for all RESOLVED incidents in this batch
    const postMortemRecords = insertedIncidents
      .filter((inc) => inc.status === "RESOLVED")
      .map((inc) => {
        const timeSpentMinutes = Math.floor(Math.random() * 240) + 15; // 15m to 255m
        const resolvedAt = new Date(
          inc.createdAt.getTime() + (timeSpentMinutes + Math.floor(Math.random() * 30)) * 60 * 1000
        );

        return {
          incidentId: inc.id,
          rootCause: randomChoice(ROOT_CAUSES),
          resolutionSteps: randomChoice(RESOLUTION_STEPS),
          timeSpentMinutes,
          createdAt: resolvedAt,
        };
      });

    if (postMortemRecords.length > 0) {
      await prisma.postMortem.createMany({
        data: postMortemRecords,
      });
    }

    console.log(
      `✓ Seeded batch ${batchIdx + 1}/${numBatches} (${(batchIdx + 1) * BATCH_SIZE > TOTAL_INCIDENTS ? TOTAL_INCIDENTS : (batchIdx + 1) * BATCH_SIZE}/${TOTAL_INCIDENTS} records)`
    );
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\n🎉 Successfully seeded ${TOTAL_INCIDENTS} bulk incidents in ${durationSec}s!`
  );
  console.log(`   - Open incidents: ${totalOpen} (~${((totalOpen / TOTAL_INCIDENTS) * 100).toFixed(1)}%)`);
  console.log(`   - Resolved incidents with post-mortems: ${totalResolved} (~${((totalResolved / TOTAL_INCIDENTS) * 100).toFixed(1)}%)`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Bulk seeding failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
