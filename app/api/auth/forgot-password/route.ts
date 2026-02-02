import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/resend-email";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // For security, don't reveal if the email exists or not
    // Always return success message
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    // Save reset token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send password reset email
    try {
      const result = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName || undefined
      );
      return NextResponse.json(
        {
          message: "If an account exists with this email, a password reset link has been sent.",
          ...(process.env.NODE_ENV !== "production" && (result as any)?.devResetUrl
            ? { devResetUrl: (result as any).devResetUrl }
            : {}),
        },
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Still return success to user for security
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
