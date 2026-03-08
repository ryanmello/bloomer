import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUserFromDb } from "@/lib/auth-utils"

// Use secure cookies only when NOT on localhost (fixes session issues in local dev)
const isLocalhost =
  !process.env.NEXTAUTH_URL ||
  process.env.NEXTAUTH_URL.includes("localhost") ||
  process.env.NEXTAUTH_URL.includes("127.0.0.1")

export const { handlers, signIn, signOut, auth } = NextAuth({
  useSecureCookies: !isLocalhost,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Directly validate user credentials using the database
          const user = await getUserFromDb(
            credentials.email as string,
            credentials.password as string
          );

          if (!user || !user.id) {
            return null;
          }
          
          return {
            id: user.id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,

          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  // Configure for Edge Runtime compatibility
  trustHost: true,
})
