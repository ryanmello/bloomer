/**
 * Square sync pipeline
 *
 * GET  — connection status and last successful sync time
 * POST — runs customer + catalog import/export and records lastSyncAt
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";
import { cookies } from "next/headers";
import { syncSquareCustomersForShop } from "@/lib/square-customer-sync";
import {
  syncSquareCatalogExportForShop,
  syncSquareCatalogImportForShop,
} from "@/lib/square-catalog-sync";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ connected: false, lastSyncIso: null });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      connected: integration?.connected ?? false,
      lastSyncIso: integration?.lastSyncAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Square sync status error:", error);
    return NextResponse.json({ connected: false, lastSyncIso: null });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!integration?.connected) {
      return NextResponse.json(
        { error: "Square not connected" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: { id: activeShopId, userId: user.id },
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

    let catalogImported = 0;
    let catalogExported = 0;
    try {
      const imp = await syncSquareCatalogImportForShop(user.id, shop.id);
      catalogImported = imp.productsUpserted;
    } catch (e) {
      console.error("Square catalog import error:", e);
    }

    try {
      const exp = await syncSquareCatalogExportForShop(user.id, shop.id);
      catalogExported = exp.productsExported;
    } catch (e) {
      console.error("Square catalog export error:", e);
    }

    const now = new Date();
    await db.squareIntegration.update({
      where: { userId: user.id },
      data: { lastSyncAt: now },
    });

    return NextResponse.json({
      ok: true,
      lastSyncIso: now.toISOString(),
      customersProcessed,
      catalogImported,
      catalogExported,
    });
  } catch (error) {
    console.error("Square sync error:", error);
    if (error instanceof Error && error.message === "Square not connected") {
      return NextResponse.json(
        {
          error:
            "Square not connected. Please connect your Square account in Settings.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
