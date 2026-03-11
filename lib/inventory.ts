/**
 * Server-side inventory helpers
 * Used by Dashboard and other server components to fetch products for the current user's shop.
 */

import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";

export type InventoryProduct = {
  id: string;
  name: string;
  quantity: number;
  lowInventoryAlert: number;
  category: string;
};

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getStockStatus(
  quantity: number,
  threshold: number
): StockStatus {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= threshold) return "low-stock";
  return "in-stock";
}

export async function getProductsForDashboard(): Promise<{
  products: InventoryProduct[];
  noShop: boolean;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { products: [], noShop: true };
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
    return { products: [], noShop: true };
  }

  const products = await db.product.findMany({
    where: { shopId: shop.id },
    select: {
      id: true,
      name: true,
      quantity: true,
      lowInventoryAlert: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      lowInventoryAlert: p.lowInventoryAlert ?? 10,
      category: p.category ?? "General",
    })),
    noShop: false,
  };
}
