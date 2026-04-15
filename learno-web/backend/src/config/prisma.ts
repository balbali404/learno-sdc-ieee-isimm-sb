import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

// Initialize pg pool
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Singleton Prisma Client — reused across the app
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

export default prisma;
