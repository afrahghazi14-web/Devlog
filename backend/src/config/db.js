import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Prisma 7 requires a driver adapter for database connections.
// We maintain a single shared PrismaClient instance across the entire application
// to prevent connection pool exhaustion and ensure consistent state.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
