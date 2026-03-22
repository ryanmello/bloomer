import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

/**
 * GET /api/automation/[id]/analytics
 * Returns aggregated metrics for a specific automation
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    if (!activeShopId) {
      return NextResponse.json({ error: "No active shop selected" }, { status: 400 });
    }

    // Verify automation exists and belongs to user's shop
    const automation = await db.automation.findFirst({
      where: { id, shopId: activeShopId },
      include: { shop: true },
    });

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    if (automation.shop.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all runs for this automation
    const runs = await db.automationRun.findMany({
      where: { automationId: id },
      select: {
        status: true,
        openedAt: true,
        clickedAt: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const total = runs.length;
    const sent = runs.filter(r => r.status === "sent" || r.status === "delivered").length;
    const opened = runs.filter(r => r.openedAt !== null).length;
    const clicked = runs.filter(r => r.clickedAt !== null).length;
    const failed = runs.filter(r => r.status === "failed" || r.status === "bounced").length;
    const skipped = runs.filter(r => r.status === "skipped").length;

    // Calculate rates (avoid division by zero)
    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;

    return NextResponse.json({
      automationId: id,
      total,
      sent,
      opened,
      clicked,
      failed,
      skipped,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching automation analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
