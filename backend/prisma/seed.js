import { prisma } from "../src/config/db.js";

// Seed script to initialize development database with baseline services, incidents,
// and post-mortems for local development and grading demos.

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing records in foreign key dependency order:
  // 1. PostMortem (references Incident)
  // 2. Incident (references Service)
  // 3. Service (parent)
  // This guarantees idempotency so the seed script can be safely re-run without errors or duplicates.
  await prisma.$transaction([
    prisma.postMortem.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.service.deleteMany(),
  ]);

  console.log("🧹 Cleaned existing services, incidents, and post-mortems.");

  // 1. Insert 3 baseline services
  const userAuth = await prisma.service.create({
    data: {
      name: "User Auth",
      environment: "PRODUCTION",
    },
  });

  const billingEngine = await prisma.service.create({
    data: {
      name: "Billing Engine",
      environment: "PRODUCTION",
    },
  });

  const notificationApi = await prisma.service.create({
    data: {
      name: "Notification API",
      environment: "STAGING",
    },
  });

  console.log("✓ Seeded 3 services: User Auth, Billing Engine, Notification API");

  // 2. Insert 3 incidents:
  // - Incident 1: OPEN (CRITICAL)
  await prisma.incident.create({
    data: {
      serviceId: userAuth.id,
      title: "High latency on user authentication token verification",
      description: "Auth token verification requests taking over 3 seconds under peak load.",
      severity: "CRITICAL",
      status: "OPEN",
    },
  });

  // - Incident 2: OPEN (MEDIUM)
  await prisma.incident.create({
    data: {
      serviceId: notificationApi.id,
      title: "Push notification delivery queue delay",
      description: "Background worker queue backing up during marketing broadcast delivery.",
      severity: "MEDIUM",
      status: "OPEN",
    },
  });

  // - Incident 3: RESOLVED with PostMortem (HIGH, 90 mins)
  const resolvedIncident = await prisma.incident.create({
    data: {
      serviceId: billingEngine.id,
      title: "Invoice PDF generation timeout",
      description: "Monthly billing cycle invoice generation job timed out due to memory limits.",
      severity: "HIGH",
      status: "RESOLVED",
    },
  });

  await prisma.postMortem.create({
    data: {
      incidentId: resolvedIncident.id,
      rootCause: "Chromium headless process memory leak during parallel batch rendering of PDF invoices.",
      resolutionSteps: "Allocated 4GB container memory limit and pooled Chromium browser instances with automatic worker recycling.",
      timeSpentMinutes: 90,
    },
  });

  console.log("✓ Seeded 3 incidents: 2 OPEN, 1 RESOLVED with PostMortem (90 minutes)");
  console.log("✅ Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
