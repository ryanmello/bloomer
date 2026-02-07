import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

const scalarFields = ["group", "email", "phoneNumber"];
const relationFields = ["location"]; // addresses
const derivedFields = ["totalSpent", "totalOrders", "lastOrderDate", "joinDate"];

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

    let customerCount = 0;

    // Scalar fields like group/email/phoneNumber
    if (audience.type === "custom" && audience.field) {
      if (scalarFields.includes(audience.field)) {
        customerCount = await db.customer.count({
          where: { shopId: shop.id, [audience.field]: { not: null } },
        });
      } 
      // Relation field (addresses)
      else if (audience.field === "location") {
        customerCount = await db.customer.count({
          where: { shopId: shop.id, addresses: { some: {} } },
        });
      } 
      // Derived fields from orders
      else if (derivedFields.includes(audience.field)) {
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
          const customers = await db.customer.findMany({
            where: { shopId: shop.id, createdAt: { not: null } },
            select: { id: true },
          });
          customerCount = customers.length;
        }
      } 
      // Invalid field
      else {
        return NextResponse.json({ message: "Invalid audience field" }, { status: 400 });
      }
    } else {
      // Not custom or no field => all shop customers
      customerCount = await db.customer.count({ where: { shopId: shop.id } });
    }

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
      field: audience.field,
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