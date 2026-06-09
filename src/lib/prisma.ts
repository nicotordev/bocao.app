import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

declare global {
  var prisma: ReturnType<typeof getPrismaClient> | undefined;
}

export const prisma = global.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
