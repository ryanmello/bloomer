import { handlers } from "@/auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import prisma from "@/lib/prisma"

export const { GET, POST } = handlers

// Use Node.js runtime for Auth.js
export const runtime = 'nodejs'
