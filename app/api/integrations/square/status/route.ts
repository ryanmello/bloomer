import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration || !integration.connected) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      merchantId: integration.merchantId,
    });
  } catch (error: any) {
    console.error("Square status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
