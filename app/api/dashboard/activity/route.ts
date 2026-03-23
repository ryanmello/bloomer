/**
 * Recent Activity Feed API
 *
 * GET /api/dashboard/activity
 *
 * Returns a unified feed of recent events:
 * - New orders (from Prisma Order or Square sync)
 * - New customers
 * - Low stock alerts (from Product where quantity <= lowInventoryAlert)
 * - Inventory adjustments (from InventoryMovement)
 *
 * Query params:
 * - limit: number (default 10, max 50)
 * - cursor: string (opaque cursor for pagination)
 * - shopId: optional - uses active shop from cookie if omitted
 *
 * @see UN-747, UN-748, UN-749, UN-752
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";
import db from "@/lib/prisma";
import { fetchSquareOrders } from "@/lib/square";
import type { SquareOrder } from "@/lib/square";

export type ActivityType =
  | "order"
  | "customer"
  | "low_stock"
  | "inventory_adjustment";

export type ActivityItem =
  | {
      type: "order";
      id: string;
      createdAt: string;
      source: "prisma" | "square";
      data: {
        totalAmount?: number;
        currency?: string;
        status: string;
        customerName?: string;
      };
    }
  | {
      type: "customer";
      id: string;
      createdAt: string;
      data: {
        name: string;
        email: string;
      };
    }
  | {
      type: "low_stock";
      id: string;
      createdAt: string;
      data: {
        productName: string;
        quantity: number;
        threshold: number;
      };
    }
  | {
      type: "inventory_adjustment";
      id: string;
      createdAt: string;
      data: {
        productName: string;
        quantity: number;
        type: string;
        reason?: string;
      };
    };

export type ActivityFeedResponse = {
  items: ActivityItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function encodeCursor(createdAt: string, id: string, type: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id, type })).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string; type: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function getShopForUser(
  userId: string,
  activeShopId: string | null,
  queryShopId: string | null
): Promise<{ id: string } | null> {
  const shopId = queryShopId || activeShopId;
  if (shopId) {
    const shop = await db.shop.findFirst({
      where: { id: shopId, userId },
      select: { id: true },
    });
    return shop;
  }
  const shop = await db.shop.findFirst({
    where: { userId },
    select: { id: true },
  });
  return shop;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value ?? null;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const cursorParam = searchParams.get("cursor");
    const queryShopId = searchParams.get("shopId");

    const shop = await getShopForUser(user.id, activeShopId, queryShopId);
    if (!shop) {
      return NextResponse.json(
        { items: [], nextCursor: null, hasMore: false },
        { status: 200 }
      );
    }

    const cursor = cursorParam ? decodeCursor(cursorParam) : null;

    // 1. Prisma Orders (Order -> Customer -> shopId)
    const prismaOrders = await db.order.findMany({
      where: { customer: { shopId: shop.id } },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 2. New customers
    const customers = await db.customer.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 3. Low stock products (quantity <= lowInventoryAlert)
    const lowStockWithThreshold = await db.product.findMany({
      where: { shopId: shop.id, trackInventory: true },
      select: { id: true, name: true, quantity: true, lowInventoryAlert: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    const lowStock = lowStockWithThreshold.filter(
      (p) => p.quantity <= (p.lowInventoryAlert ?? 10)
    );

    // 4. Inventory movements
    const movements = await db.inventoryMovement.findMany({
      where: { shopId: shop.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 5. Square orders (user-level, include when connected)
    let squareOrders: SquareOrder[] = [];
    const squareData = await fetchSquareOrders(user.id);
    if (squareData?.completedOrders) {
      squareOrders = [...squareData.completedOrders].reverse();
    }

    // Build unified activity items with sort key
    type Row = { createdAt: Date; id: string; type: ActivityType; item: ActivityItem };
    const rows: Row[] = [];

    for (const o of prismaOrders) {
      rows.push({
        createdAt: o.createdAt,
        id: o.id,
        type: "order",
        item: {
          type: "order",
          id: o.id,
          createdAt: o.createdAt.toISOString(),
          source: "prisma",
          data: {
            totalAmount: o.totalAmount,
            status: o.status,
            customerName: [o.customer.firstName, o.customer.lastName].filter(Boolean).join(" "),
          },
        },
      });
    }

    for (const c of customers) {
      rows.push({
        createdAt: c.createdAt,
        id: c.id,
        type: "customer",
        item: {
          type: "customer",
          id: c.id,
          createdAt: c.createdAt.toISOString(),
          data: {
            name: `${c.firstName} ${c.lastName}`.trim() || c.email,
            email: c.email,
          },
        },
      });
    }

    for (const p of lowStock) {
      rows.push({
        createdAt: p.updatedAt,
        id: p.id,
        type: "low_stock",
        item: {
          type: "low_stock",
          id: p.id,
          createdAt: p.updatedAt.toISOString(),
          data: {
            productName: p.name,
            quantity: p.quantity,
            threshold: p.lowInventoryAlert ?? 10,
          },
        },
      });
    }

    for (const m of movements) {
      rows.push({
        createdAt: m.createdAt,
        id: m.id,
        type: "inventory_adjustment",
        item: {
          type: "inventory_adjustment",
          id: m.id,
          createdAt: m.createdAt.toISOString(),
          data: {
            productName: m.product.name,
            quantity: m.quantity,
            type: m.type,
            reason: m.reason ?? undefined,
          },
        },
      });
    }

    for (const o of squareOrders) {
      rows.push({
        createdAt: new Date(o.created_at),
        id: o.id,
        type: "order",
        item: {
          type: "order",
          id: o.id,
          createdAt: o.created_at,
          source: "square",
          data: {
            totalAmount: o.total_money ? o.total_money.amount / 100 : undefined,
            currency: o.total_money?.currency ?? "USD",
            status: o.state,
          },
        },
      });
    }

    // Sort by createdAt desc, then by id for ties
    rows.sort((a, b) => {
      const tA = a.createdAt.getTime();
      const tB = b.createdAt.getTime();
      if (tB !== tA) return tB - tA;
      return a.id.localeCompare(b.id);
    });

    // Apply cursor
    let startIndex = 0;
    if (cursor) {
      const idx = rows.findIndex(
        (r) =>
          r.createdAt.toISOString() === cursor.createdAt &&
          r.id === cursor.id &&
          r.type === cursor.type
      );
      startIndex = idx >= 0 ? idx + 1 : 0;
    }

    const page = rows.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < rows.length;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeCursor(last.createdAt.toISOString(), last.id, last.type)
        : null;

    const items = page.map((r) => r.item);

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Activity feed API error:", err);
    return NextResponse.json(
      { error: "Failed to load activity feed" },
      { status: 500 }
    );
  }
}
