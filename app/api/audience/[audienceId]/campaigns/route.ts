import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ audienceId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { audienceId } = await params;
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop = null;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: { userId: user.id },
      });
    }

    if (!shop) {
      return NextResponse.json({ message: "No shop found" }, { status: 404 });
    }

    const audience = await db.audience.findFirst({
      where: {
        id: audienceId,
        shopId: shop.id,
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!audience) {
      return NextResponse.json({ message: "Audience not found" }, { status: 404 });
    }

    const campaigns = await db.campaign.findMany({
      where: {
        shopId: shop.id,
        audienceId: audience.id,
      },
      select: {
        id: true,
        campaignName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      audience,
      campaigns,
    });
  } catch (error) {
    console.error("Error fetching audience campaigns:", error);
    return NextResponse.json({ message: "Failed to fetch campaigns" }, { status: 500 });
  }
}
