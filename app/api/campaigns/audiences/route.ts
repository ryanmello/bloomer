import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

// GET - Get audience counts for the shop
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const shops = await db.shop.findMany({
      where: { userId: user.id }
    });

    if (!shops || shops.length === 0) {
      return NextResponse.json(
        { message: "No shop found" },
        { status: 404 }
      );
    }

    const shopId = shops[0].id;

    // Get counts for each audience type
    // Note: Using 'group' field for customer segmentation
    const [allCount, vipCount, newCount, potentialCount] = await Promise.all([
      db.customer.count({ where: { shopId } }),
      db.customer.count({ where: { shopId, group: 'VIP' } }),
      db.customer.count({ where: { shopId, group: 'New' } }),
      db.customer.count({ where: { shopId, group: 'Potential' } }),
    ]);

    const audiences = [
      { id: 'all', name: 'All Customers', count: allCount },
      { id: 'vip', name: 'VIP Customers', count: vipCount },
      { id: 'new', name: 'New Customers', count: newCount },
      { id: 'potential', name: 'Potential Customers', count: potentialCount },
      { id: 'newsletter', name: 'Newsletter Subscribers', count: 0 }, // Newsletter feature not yet implemented
    ];

    return NextResponse.json(audiences);
  } catch (error) {
    console.error("Error fetching audiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiences" },
      { status: 500 }
    );
  }
}
