import { NextRequest, NextResponse } from "next/server";
import { saltAndHashPassword } from "@/utils/password";
import { createUser, userExists } from "@/lib/auth-utils";

// Ensure this runs in Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const exists = await userExists(email);
    if (exists) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = saltAndHashPassword(password);

    // Create the user
    const user = await createUser(email, hashedPassword, firstName, lastName);

    if (!user) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    // Return success (without password)
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
