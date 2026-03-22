import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        campaignName: true,
        status: true,
        sentAt: true,
        userId: true,
        shopId: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 },
      );
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 },
      );
    }

    const recipients = await db.campaignRecipient.findMany({
      where: { campaignId: id },
      select: {
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
      },
    });

    const totalRecipients = recipients.length;
    let sentCount = 0;
    let openCount = 0;
    let clickCount = 0;
    const statusBreakdown: Record<string, number> = {};

    for (const r of recipients) {
      if (r.sentAt) sentCount++;
      if (r.openedAt) openCount++;
      if (r.clickedAt) clickCount++;

      const key = r.status;
      statusBreakdown[key] = (statusBreakdown[key] || 0) + 1;
    }

    return NextResponse.json({
      campaignId: campaign.id,
      campaignName: campaign.campaignName,
      status: campaign.status,
      sentAt: campaign.sentAt,
      totalRecipients,
      sentCount,
      openCount,
      clickCount,
      deliveryStatusBreakdown: statusBreakdown,
    });
  } catch (err) {
    console.error("Error fetching campaign analytics:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaign analytics" },
      { status: 500 },
    );
  }
}
