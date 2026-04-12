import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";
import { syncSquareCustomersForShop } from "@/lib/square-customer-sync";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
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

    const { customersProcessed } = await syncSquareCustomersForShop(
      user.id,
      shop.id
    );

    return NextResponse.json({
      message: "Customers imported successfully.",
      customersProcessed,
    });
  } catch (err) {
    console.error("Error importing customers:", err);
    const message =
      err instanceof Error && err.message === "Square not connected"
        ? "Square not connected. Please connect your Square account in Settings."
        : "Failed to import customers";
    const status =
      err instanceof Error && err.message === "Square not connected" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
