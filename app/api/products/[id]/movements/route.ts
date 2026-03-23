/**
 * Inventory Movement History API
 *
 * GET /api/products/[id]/movements
 *
 * Returns paginated InventoryMovement records for a product.
 * Used for audit/history view in the UI.
 *
 * Query params:
 * - limit: number (default 20, max 100)
 * - cursor: string (opaque cursor for pagination)
 *
 * @see UN-770, UN-771
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

export type MovementItem = {
  id: string;
  type: string;
  quantity: number;
  previousInventory: number;
  newInventory: number;
  reason: string | null;
  notes: string | null;
  createdAt: string;
};

export type MovementsResponse = {
  items: MovementItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function encodeCursor(id: string): string {
  return Buffer.from(JSON.stringify({ id })).toString("base64url");
}

function decodeCursor(cursor: string): { id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.shop.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view this product" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT
      )
    );
    const cursorParam = searchParams.get("cursor");

    const decoded = cursorParam ? decodeCursor(cursorParam) : null;

    const movements = await db.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(decoded && { cursor: { id: decoded.id }, skip: 1 }),
    });

    const hasMore = movements.length > limit;
    const page = hasMore ? movements.slice(0, limit) : movements;
    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.id) : null;

    const items: MovementItem[] = page.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      previousInventory: m.previousInventory,
      newInventory: m.newInventory,
      reason: m.reason,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Inventory movements API error:", err);
    return NextResponse.json(
      { error: "Failed to load movement history" },
      { status: 500 }
    );
  }
}
