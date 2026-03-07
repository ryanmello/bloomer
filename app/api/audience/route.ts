import { NextResponse } from "next/server";
import db from "../../../lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";

// fetch audiences card
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Get the active shop ID from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    // Try to get the active shop if one is set
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id, // Security: ensure shop belongs to authenticated user
        },
      });
    }

    // Fallback: if no active shop or it doesn't exist, get user's first shop
    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    // Return empty array if user has no shops
    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    // fetch all audiences including their customerIds array
    const audiences = await db.audience.findMany({
      where: { shopId: shop.id },
    });

    const allCustomerIds = Array.from(
      new Set(audiences.flatMap((aud) => aud.customerIds)),
    );

    const customers =
      allCustomerIds.length > 0
        ? await db.customer.findMany({
          where: { id: { in: allCustomerIds } },
          select: {
            id: true,
            createdAt: true,
            orderCount: true,
            spendAmount: true,
          },
        })
        : [];

    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const audiencesWithMetrics = await Promise.all(
      audiences.map(async (aud) => {
        // remove undefined safely
        const definedCustomers = (aud.customerIds || [])
          .map((id) => customerMap.get(id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));

        const customerCount = definedCustomers.length;

        // campaigns sent
        const campaignsSent = await db.campaign.count({
          where: { shopId: shop.id, audienceId: aud.id },
        });

        const lastCampaignObj = await db.campaign.findFirst({
          where: { shopId: shop.id, audienceId: aud.id },
          orderBy: { createdAt: "desc" },
        });

        // growth Rate
        const customersBefore = definedCustomers.filter(
          (c) => c.createdAt < thirtyDaysAgo
        ).length;

        const growthRate =
          customersBefore === 0
            ? 0
            : ((customerCount - customersBefore) / customersBefore) * 100;

        // engagement Rate
        const totalRecipients = await db.campaignRecipient.count({
          where: { campaign: { audienceId: aud.id } },
        });

        const engagedRecipients = await db.campaignRecipient.count({
          where: {
            campaign: { audienceId: aud.id },
            status: { in: ["Opened", "Clicked"] },
          },
        });

        const engagementRate =
          totalRecipients === 0
            ? 0
            : (engagedRecipients / totalRecipients) * 100;

        return {
          ...aud,
          customers: definedCustomers,
          customerCount,
          campaignsSent,
          lastCampaignName: lastCampaignObj?.campaignName ?? "",
          lastCampaignAt: lastCampaignObj?.createdAt?.toISOString() ?? "",
          growthRate,
          engagementRate,
        };
      })
    );

    return NextResponse.json(audiencesWithMetrics);
  } catch (err) {
    console.error("Error fetching audience:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// create audiences
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Get the active shop ID from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    // Try to get the active shop if one is set
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id, // Security: ensure shop belongs to authenticated user
        },
      });
    }

    // Fallback: if no active shop or it doesn't exist, get user's first shop
    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    // Return empty array if user has no shops
    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    const body = await req.json();

    // include the new customerIds field if provided
    const newAudience = await db.audience.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        field: body.field || null,
        customerIds: body.customerIds || [],
        userId: user.id,
        shopId: shop.id,
      },
    });

    return NextResponse.json(
      { message: "Audience created successfully!", audience: newAudience },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating audience:", error);
    return NextResponse.json(
      { error: "Failed to create audience" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids, id } = body;

    if (!id && (!ids || ids.length === 0)) {
      return NextResponse.json(
        { error: "Audience ID(s) are required" },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    // Get the active shop ID from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    // Try to get the active shop if one is set
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id, // Security: ensure shop belongs to authenticated user
        },
      });
    }

    // Fallback: if no active shop or it doesn't exist, get user's first shop
    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    // Return empty array if user has no shops
    if (!shop) {
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    if (ids && ids.length > 0) {
      await db.audience.deleteMany({
        where: { id: { in: ids }, shopId: shop.id },
      });
      return NextResponse.json(
        { message: "Audiences deleted successfully!" },
        { status: 200 },
      );
    } else if (id) {
      const audience = await db.audience.findFirst({
        where: { id, shopId: shop.id },
      });
      if (!audience) {
        return NextResponse.json(
          { message: "Audience not found" },
          { status: 404 },
        );
      }
      await db.audience.delete({ where: { id } });
      return NextResponse.json(
        { message: "Audience deleted successfully!" },
        { status: 200 },
      );
    }
  } catch (err) {
    console.error("Error deleting audience:", err);
    return NextResponse.json(
      { message: "Failed to delete audience" },
      { status: 500 },
    );
  }
}
