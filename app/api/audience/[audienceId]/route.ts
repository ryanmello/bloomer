import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

const scalarFields = ["group", "email", "phoneNumber"];
const relationFields = ["location"]; // addresses
const derivedFields = ["totalSpent", "totalOrders", "lastOrderDate", "joinDate"];

// fetch audience data
export async function GET(
  _req: NextRequest,
  // route [audienceId]
  // Next.js, audienceId = "abc123" as params
  // params = { audienceId: "abc123" }
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const { audienceId } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const shop = await db.shop.findFirst({
      where: { userId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ message: "No shop found for user" }, { status: 404 });
    }

    const audience = await db.audience.findFirst({
      where: { id: audienceId, userId: user.id, shopId: shop.id },
    });

    if (!audience) {
      return NextResponse.json({ message: "Audience not found" }, { status: 404 });
    }

    let customerCount = 0;

    // compute customerCount based on audience type and field
    if (audience.type === "custom" && audience.field) {
      if (scalarFields.includes(audience.field)) {
        customerCount = await db.customer.count({
          where: { shopId: shop.id, [audience.field]: { not: null } },
        });
      } else if (audience.field === "location") {
        customerCount = await db.customer.count({
          where: { shopId: shop.id, addresses: { some: {} } },
        });
      } else if (derivedFields.includes(audience.field)) {
        if (audience.field === "totalSpent") {
          const customers = await db.customer.findMany({
            where: { shopId: shop.id },
            select: { spendAmount: true },
          });
          customerCount = customers.filter(c => c.spendAmount > 0).length;
        } else if (audience.field === "totalOrders") {
          const customers = await db.customer.findMany({
            where: { shopId: shop.id },
            select: { orderCount: true },
          });
          customerCount = customers.filter(c => c.orderCount > 0).length;
        } else if (audience.field === "lastOrderDate") {
          const customers = await db.customer.findMany({
            where: { shopId: shop.id },
            select: { orders: { select: { createdAt: true } } },
          });
          customerCount = customers.filter(c => c.orders.length > 0).length;
        } else if (audience.field === "joinDate") {
          const customerCount = await db.customer.count({
            where: { shopId: shop.id },
          });
        }
      } else {
        return NextResponse.json({ message: "Invalid audience field" }, { status: 400 });
      }
    } else {
      // not custom or no field => all shop customers
      customerCount = await db.customer.count({ where: { shopId: shop.id } });
    }

    const campaignsSent = await db.campaign.count({
      where: {
        shopId: shop.id,
        audienceId: audience.id,
      },
    });

    const lastCampaignObj = await db.campaign.findFirst({
      where: {
        shopId: shop.id,
        audienceId: audience.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      id: audience.id,
      name: audience.name,
      description: audience.description || "",
      status: audience.status,
      type: audience.type,
      field: audience.field,
      customerCount,
      campaignsSent,
      lastCampaign: lastCampaignObj ? lastCampaignObj.createdAt.toISOString() : "",
      growthRate: 0, // placeholder
      engagementRate: 0, // placeholder
    });
  } catch (err) {
    console.error("Error fetching audience:", err);
    return NextResponse.json(
      { message: "Failed to fetch audience" },
      { status: 500 }
    );
  }
}

// update audience data
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const { audienceId } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const shop = await db.shop.findFirst({
      where: { userId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ message: "No shop found" }, { status: 404 });
    }

    const existing = await db.audience.findFirst({
      where: { id: audienceId, userId: user.id, shopId: shop.id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Audience not found" }, { status: 404 });
    }

    const body = await req.json();

    const updateAudience = await db.audience.update({
      where: { id: audienceId },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        field: body.field ?? undefined,
        customerIds: body.customerIds || [],
      },
    });

    if (updateAudience)
      return NextResponse.json({
        message: "Audience updated successfully!",
      });

    return NextResponse.json(updateAudience, { status: 201 });
  } catch (err) {
    console.error("Error update audience:", err);
    return NextResponse.json([]);
  }
}
