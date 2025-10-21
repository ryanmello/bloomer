import { Prisma, PrismaClient } from "@prisma/client"

declare global {
    var prisma: PrismaClient | undefined;
    var _prisma: PrismaClient | undefined;
}

export const _prisma = global.prisma ?? new PrismaClient({
    log: ["query", "info", "warn", "error"],
});
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
export const db = globalForPrisma.prisma || new PrismaClient()
 
if (process.env.NODE_ENV !== "production") {
    global._prisma = _prisma;
}
