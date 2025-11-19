import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";
import { verifyBackupCode } from "@/lib/2fa-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { password, backupCode } = await request.json();

    // Must provide either password or backup code
    if (!password && !backupCode) {
      return NextResponse.json(
        { message: "Password or backup code is required" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { message: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    let verified = false;

    // Verify using password
    if (password) {
      if (!user.password) {
        return NextResponse.json(
          { message: "Password authentication not available" },
          { status: 400 }
        );
      }
      verified = verifyPassword(password, user.password);
    }
    // Verify using backup code
    else if (backupCode && user.backupCodes.length > 0) {
      const result = await verifyBackupCode(backupCode, user.backupCodes);
      verified = result.valid;
    }

    if (!verified) {
      console.log(
        `Failed 2FA disable attempt for user: ${session.user.email} at ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { message: "Invalid password or backup code" },
        { status: 401 }
      );
    }

    // Verification successful - disable 2FA
    await db.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    // Log successful 2FA disablement
    console.log(
      `2FA disabled for user: ${session.user.email} at ${new Date().toISOString()}`
    );

    return NextResponse.json({
      message: "Two-factor authentication disabled successfully",
      success: true,
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

