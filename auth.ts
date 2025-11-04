import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getUserFromDb } from "@/lib/auth-utils"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
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

          if (!user) {
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  // Configure for Edge Runtime compatibility
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
})