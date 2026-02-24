import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailIntegration = (db as any).emailIntegration;
    if (!emailIntegration?.findMany) {
      console.error("[Inbox Status] EmailIntegration model not found. Run: npx prisma generate");
      return NextResponse.json(
        { error: "Database schema not ready. Stop the dev server, run 'npx prisma generate', then restart." },
        { status: 503 }
      );
    }

    const integrations = await emailIntegration.findMany({
      where: { userId: user.id, connected: true },
      select: { platform: true, email: true, connected: true },
    });

    const gmail = integrations.find((i: any) => i.platform === "gmail");
    const outlook = integrations.find((i: any) => i.platform === "outlook");
    const status = {
      gmail: gmail ? { email: gmail.email, connected: true } : null,
      outlook: outlook ? { email: outlook.email, connected: true } : null,
    };

    return NextResponse.json(status);
  } catch (error: unknown) {
    console.error("[Inbox Status] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load status" },
      { status: 500 }
    );
  }
}

