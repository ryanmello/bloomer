import { PrismaClient } from "@prisma/client"

declare global {
    var prisma: PrismaClient | undefined;
}

// Create a single Prisma Client instance to be reused across the application
// In development, use global to prevent multiple instances during hot reload
export const db = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") {
    global.prisma = db
}
