import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import {
  verifyTOTP,
  encryptSecret,
  hashBackupCodes,
} from "@/lib/2fa-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code, secret, backupCodes } = await request.json();

    // Validate inputs
    if (!code || !secret || !backupCodes || !Array.isArray(backupCodes)) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const isValid = verifyTOTP(secret, code);

    if (!isValid) {
      console.log(
        `Failed 2FA verification attempt for user: ${session.user.email} at ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 401 }
      );
    }

    // Code is valid - now save to database
    try {
      // Encrypt the secret
      const encryptedSecret = encryptSecret(secret);

      // Hash the backup codes
      const hashedBackupCodes = await hashBackupCodes(backupCodes);

      // Update user in database
      await db.user.update({
        where: { email: session.user.email },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encryptedSecret,
          backupCodes: hashedBackupCodes,
        },
      });

      // Log successful 2FA enablement
      console.log(
        `2FA enabled successfully for user: ${session.user.email} at ${new Date().toISOString()}`
      );

      return NextResponse.json({
        message: "Two-factor authentication enabled successfully",
        success: true,
      });
    } catch (dbError) {
      console.error("Database error while enabling 2FA:", dbError);
      return NextResponse.json(
        { message: "Failed to save 2FA settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("2FA verify error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

