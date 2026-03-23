/**
 * Inventory Adjustment API
 *
 * PATCH /api/products/[id]/adjust
 * Adjusts product quantity and creates an audit log (InventoryMovement).
 * Enforces organization-level access (product must belong to user's shop).
 */

import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

export async function PATCH(
  req: Request,
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
        { error: "You cannot adjust inventory for another organization" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const delta = parseInt(String(body.delta ?? body.quantity ?? 0), 10);
    const type = body.type || "adjustment";
    const reason = body.reason || null;
    const notes = body.notes || null;

    if (isNaN(delta) || delta === 0) {
      return NextResponse.json(
        { error: "delta must be a non-zero integer (positive to add, negative to remove)" },
        { status: 400 }
      );
    }

    const previousInventory = product.quantity;
    const newInventory = Math.max(0, previousInventory + delta);

    const threshold = product.lowInventoryAlert ?? 10;
    const wasAboveThreshold = previousInventory > threshold;
    const wasInStock = previousInventory > 0;
    const nowAtOrBelowThreshold = newInventory <= threshold;
    const nowOutOfStock = newInventory === 0;

    const crossedLowStockThreshold =
      wasAboveThreshold && nowAtOrBelowThreshold && wasInStock;
    const crossedOutOfStock = wasInStock && nowOutOfStock;

    await db.$transaction(async (tx) => {
      await (tx as any).product.update({
        where: { id: productId },
        data: { quantity: newInventory },
      });

      await (tx as any).inventoryMovement.create({
        data: {
          type,
          quantity: delta,
          previousInventory,
          newInventory,
          reason,
          notes,
          productId,
          shopId: product.shopId,
        },
      });
    });

    const updated = await db.product.findUnique({
      where: { id: productId },
      include: { shop: true },
    });
    
    return NextResponse.json({
      product: updated,
      movement: {
        previousInventory,
        newInventory,
        delta,
      },
      lowStockAlert: crossedLowStockThreshold,
      outOfStockAlert: crossedOutOfStock,
    });
  } catch (error) {
    console.error("[Inventory Adjust]", error);
    return NextResponse.json(
      {
        error: "Failed to adjust inventory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
