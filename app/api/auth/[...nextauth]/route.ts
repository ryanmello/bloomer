import { handlers } from "@/auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import prisma from "@/lib/prisma"

export const { GET, POST } = handlers

// Use Node.js runtime for Auth.js
export const runtime = 'nodejs'

export const auth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach user's email and ID to session
      
      session.user.id = user.id;
      session.user.email = user.email!;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});