import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform } = await request.json();

    if (!platform || !['gmail', 'outlook'].includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const result = await (db as any).emailIntegration.updateMany({
      where: { userId: user.id, platform },
      data: {
        connected: false,
        accessToken: "[revoked]",
        refreshToken: null,
      },
    });

    if (result.count === 0) {
      console.warn("[Inbox Disconnect] No integration found for user/platform", user.id, platform);
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[Inbox Disconnect] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect" },
      { status: 500 }
    );
  }
}

