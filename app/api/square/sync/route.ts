import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ connected: false, lastSyncIso: null });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      connected: integration?.connected ?? false,
      lastSyncIso: null,
    });
  } catch (error) {
    console.error("Square sync status error:", error);
    return NextResponse.json({ connected: false, lastSyncIso: null });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration?.connected) {
      return NextResponse.json(
        { error: "Square not connected" },
        { status: 400 }
      );
    }

    // TODO: implement actual sync pipelines using the user's token
    await new Promise((r) => setTimeout(r, 1500));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Square sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
