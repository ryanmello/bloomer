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

    await (db as any).emailIntegration.updateMany({
      where: {
        userId: user.id,
        platform,
      },
      data: {
        connected: false,
        accessToken: '',
        refreshToken: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

