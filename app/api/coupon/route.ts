import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

/**
 * GET /api/coupon
 * Fetch all coupons for the current user (for automation dropdown)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch valid coupons (not expired)
    const coupons = await db.coupon.findMany({
      where: {
        userId: user.id,
        validUntil: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        codeName: true,
        discount: true,
        validUntil: true,
        description: true,
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
