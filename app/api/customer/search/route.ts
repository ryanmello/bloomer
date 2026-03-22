import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

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
      return NextResponse.json({ error: "No shop found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limitParam = searchParams.get("limit");

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 },
      );
    }

    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, MAX_LIMIT);
      }
    }

    const customers = await db.customer.findMany({
      where: {
        shopId: shop.id,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phoneNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      take: limit,
      orderBy: { firstName: "asc" },
    });

    const results = customers.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Error searching customers:", err);
    return NextResponse.json(
      { error: "Failed to search customers" },
      { status: 500 },
    );
  }
}
