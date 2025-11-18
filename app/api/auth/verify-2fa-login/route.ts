import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { verifyTOTP, decryptSecret, verifyBackupCode } from "@/lib/2fa-utils";

export const runtime = "nodejs";

// Simple in-memory rate limiting (for production, use Redis or a proper rate limiter)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(email);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (5 attempts per 5 minutes)
    rateLimitMap.set(email, { count: 1, resetTime: now + 5 * 60 * 1000 });
    return true;
  }

  if (limit.count >= 5) {
    return false; // Rate limit exceeded
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, isBackupCode } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and code are required" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      console.log(
        `Rate limit exceeded for 2FA login: ${email} at ${new Date().toISOString()}`
      );
      return NextResponse.json(
        { message: "Too many attempts. Please try again in 5 minutes." },
        { status: 429 }
      );
    }

    // Get user with 2FA data
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    let verified = false;

    if (isBackupCode) {
      // Verify backup code
      const result = await verifyBackupCode(code, user.backupCodes);
      
      if (result.valid) {
        verified = true;
        
        // Remove used backup code
        const updatedCodes = user.backupCodes.filter((_, i) => i !== result.index);
        await db.user.update({
          where: { email },
          data: { backupCodes: updatedCodes },
        });
        
        console.log(
          `Backup code used for 2FA login: ${email} at ${new Date().toISOString()}`
        );

        // Reset rate limit on successful verification
        rateLimitMap.delete(email);
      }
    } else {
      // Verify TOTP code
      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { message: "2FA not properly configured" },
          { status: 400 }
        );
      }

      const decryptedSecret = decryptSecret(user.twoFactorSecret);
      verified = verifyTOTP(decryptedSecret, code);
      
      if (verified) {
        console.log(
          `2FA login successful: ${email} at ${new Date().toISOString()}`
        );
        // Reset rate limit on successful verification
        rateLimitMap.delete(email);
      } else {
        console.log(
          `Failed 2FA login attempt: ${email} at ${new Date().toISOString()}`
        );
      }
    }

    if (!verified) {
      return NextResponse.json(
        { message: "Invalid code" },
        { status: 401 }
      );
    }

    // Code verified - return success
    return NextResponse.json({
      success: true,
      message: "2FA verified",
    });
  } catch (error) {
    console.error("2FA login verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

