import { db } from "@/lib/prisma";
import { User } from "@prisma/client";
import { verifyPassword } from "@/utils/password";

/**
 * Get user from database by email and verify password
 */
export async function getUserFromDb(email: string, password: string): Promise<User | null> {
  try {
    const user = await db.user.findUnique({
      where: { email: email }
    });

    if (!user || !user.password) {
      return null;
    }

    // Verify the password against the stored hash
    if (verifyPassword(password, user.password)) {
      return user;
    }

    return null;
  } catch (error) {
    console.error("Error getting user from database:", error);
    return null;
  }
}

/**
 * Create a new user in the database
 */
export async function createUser(email: string, password: string, name?: string): Promise<User | null> {
  try {
    const user = await db.user.create({
      data: {
        email,
        password,
        name: name || undefined,
      },
    });

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { email }
    });
    return !!user;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}
