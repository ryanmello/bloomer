import { handlers } from "@/auth"

export const { GET, POST } = handlers

// Ensure this runs in Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'
