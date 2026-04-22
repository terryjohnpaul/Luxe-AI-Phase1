// @ts-ignore
import { PrismaClient } from "@prisma/client";
// @ts-ignore
import { PrismaPg } from "@prisma/adapter-pg";
// @ts-ignore
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

function createClient() {
  try {
    if (!process.env.DATABASE_URL) {
      return null;
    }
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new (PrismaClient as any)({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    return null;
  }
}

export const db: any = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
