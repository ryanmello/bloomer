import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

export async function GET(
  req: Request,
  { params }: { params: { audienceId: string } }
) {
  try {
    // Make sure the user is logged in before fetching any data
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { audienceId } = params;

    // Retrieve the audience details by its ID
    const audience = await db.audience.findUnique({
      where: { id: audienceId },
    });

    if (!audience) {
      return NextResponse.json({ message: "Audience not found" }, { status: 404 });
    }

    // Make sure the user has an associated shop
    const shop = await db.shop.findFirst({
      where: { userId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ message: "No shop found for user" }, { status: 404 });
    }

    // Determine which customers belong to this audience
    // For 'custom' audiences, apply the audience's field filter; otherwise, count all shop customers
    const customerFilter: any = audience.type === "custom" && audience.field
      ? { shopId: shop.id, [audience.field]: { not: null } }
      : { shopId: shop.id };

    // Count the total number of customers in this audience
    const customerCount = await db.customer.count({ where: customerFilter });

    // Count how many campaigns have been sent to this audience
    const campaignsSent = await db.campaign.count({
      where: { shopId: shop.id, audienceType: audience.type },
    });

    // Get the most recent campaign sent to this audience
    const lastCampaignObj = await db.campaign.findFirst({
      where: { shopId: shop.id, audienceType: audience.type },
      orderBy: { createdAt: "desc" },
    });

    // Return all audience data including stats for display on the website
    return NextResponse.json({
      id: audience.id,
      name: audience.name,
      description: audience.description || "",
      status: audience.status,
      type: audience.type,
      customerCount, // total number of customers in this audience
      campaignsSent, // number of campaigns sent to this audience
      lastCampaign: lastCampaignObj ? lastCampaignObj.createdAt.toISOString() : "", // most recent campaign date
      growthRate: 0, // placeholder for future growth metric
      engagementRate: 0, // placeholder for future engagement metric
    });
  } catch (error) {
    console.error(error);
    // Show a generic error message if anything goes wrong
    return NextResponse.json({ error: "Failed to fetch audience" }, { status: 500 });
  }
}