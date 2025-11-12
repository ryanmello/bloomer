import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";
import {
  generateSecret,
  generateQRCode,
  generateBackupCodes,
} from "@/lib/2fa-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has 2FA enabled
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { message: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    // Generate TOTP secret
    const secret = generateSecret();

    // Generate QR code
    const qrCodeUrl = await generateQRCode(session.user.email, secret);

    // Generate backup codes
    const backupCodes = generateBackupCodes(5);

    // Log 2FA setup initiation
    console.log(
      `2FA setup initiated for user: ${session.user.email} at ${new Date().toISOString()}`
    );

    // Return data to frontend (DO NOT save to database yet)
    // We'll save after verification in the verify endpoint
    return NextResponse.json({
      secret,
      qrCodeUrl,
      backupCodes,
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

