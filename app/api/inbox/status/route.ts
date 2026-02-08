import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integrations = await (db as any).emailIntegration.findMany({
      where: {
        userId: user.id,
        connected: true,
      },
    });

    const status = {
      gmail: integrations.find((i: any) => i.platform === 'gmail') || null,
      outlook: integrations.find((i: any) => i.platform === 'outlook') || null,
    };

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

