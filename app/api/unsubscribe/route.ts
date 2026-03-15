import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * POST: One-click unsubscribe (RFC 8058). Mail clients POST here when user clicks "Unsubscribe".
 * List-Unsubscribe header points to this API URL so one-click works.
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return new NextResponse(null, { status: 400 });
    }

    const payload = verifyUnsubscribeToken(token);
    if (!payload) {
      return new NextResponse(null, { status: 400 });
    }

    await db.customer.update({
      where: { id: payload.customerId },
      data: { unsubscribedAt: new Date() },
    });

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Unsubscribe POST error:", error);
    return new NextResponse(null, { status: 500 });
  }
}
