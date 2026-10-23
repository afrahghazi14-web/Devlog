import { prisma } from "../config/db.js";

// Repositories are the only layer allowed to communicate directly with the database.
export async function checkDatabaseConnection() {
  // Execute a lightweight query to verify active connectivity with PostgreSQL
  await prisma.$queryRawUnsafe("SELECT 1;");
}
