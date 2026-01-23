import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient({
  log: [],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;