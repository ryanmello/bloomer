/**
 * Square Catalog ↔ Bloomer Product sync
 *
 * Import: Square ITEM / ITEM_VARIATION → Product (matched by squareCatalogVariationId)
 * Export: Product without Square ids → Square Catalog (single variation per product)
 */

import db from "@/lib/prisma";
import { getSquareAccessToken } from "@/lib/square";

function getBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";
}

const SQUARE_HEADERS = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  "Square-Version": "2024-01-18",
});

type VariationRow = {
  itemId: string;
  itemName: string;
  description: string | null;
  variationId: string;
  variationLabel: string;
  priceDollars: number;
  currency: string;
};

function stripHtml(html: string | undefined | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]+>/g, "").trim() || null;
}

function collectVariationRows(
  catalogObjects: unknown[]
): VariationRow[] {
  const rows: VariationRow[] = [];

  for (const raw of catalogObjects) {
    const obj = raw as {
      type?: string;
      id?: string;
      item_data?: {
        name?: string;
        description?: string;
        description_html?: string;
        variations?: unknown[];
      };
    };

    if (obj.type !== "ITEM" || !obj.id || !obj.item_data) continue;

    const itemName = obj.item_data.name || "Item";
    const desc =
      obj.item_data.description ||
      stripHtml(obj.item_data.description_html) ||
      null;

    const variations = obj.item_data.variations || [];
    if (variations.length === 0) continue;

    for (const vRaw of variations) {
      const v = vRaw as {
        type?: string;
        id?: string;
        item_variation_data?: {
          name?: string;
          price_money?: { amount?: number; currency?: string };
        };
      };

      if (v.type !== "ITEM_VARIATION" || !v.id) continue;

      const priceMoney = v.item_variation_data?.price_money;
      const amount = priceMoney?.amount;
      if (amount == null) continue;

      const priceDollars = Number(amount) / 100;
      const currency = priceMoney?.currency || "USD";
      const varName = v.item_variation_data?.name?.trim() || "Regular";
      const displayName =
        variations.length > 1
          ? `${itemName} — ${varName}`
          : itemName;

      rows.push({
        itemId: obj.id,
        itemName: displayName,
        description: desc,
        variationId: v.id,
        variationLabel: varName,
        priceDollars,
        currency,
      });
    }
  }

  return rows;
}

async function fetchAllCatalogItems(
  accessToken: string
): Promise<unknown[]> {
  const baseUrl = getBaseUrl();
  const headers = SQUARE_HEADERS(accessToken);
  const all: unknown[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${baseUrl}/catalog/list`);
    url.searchParams.set("types", "ITEM");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), { headers });
    const data = (await res.json()) as {
      objects?: unknown[];
      cursor?: string;
      errors?: unknown;
    };

    if (!res.ok) {
      console.error("Square catalog/list error", data);
      throw new Error("Square catalog list failed");
    }

    if (data.objects?.length) {
      all.push(...data.objects);
    }
    cursor = data.cursor;
  } while (cursor);

  return all;
}

async function fetchInventoryByVariationIds(
  accessToken: string,
  locationId: string,
  variationIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (variationIds.length === 0) return map;

  const baseUrl = getBaseUrl();
  const headers = SQUARE_HEADERS(accessToken);
  const chunkSize = 100;

  for (let i = 0; i < variationIds.length; i += chunkSize) {
    const chunk = variationIds.slice(i, i + chunkSize);
    const res = await fetch(`${baseUrl}/inventory/counts/batch-retrieve`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        catalog_object_ids: chunk,
        location_ids: [locationId],
      }),
    });

    const data = (await res.json()) as {
      counts?: Array<{ catalog_object_id?: string; quantity?: string }>;
    };

    if (!res.ok) {
      console.warn("Square inventory batch-retrieve partial failure", data);
      continue;
    }

    for (const c of data.counts || []) {
      if (c.catalog_object_id != null && c.quantity != null) {
        map.set(c.catalog_object_id, parseInt(String(c.quantity), 10) || 0);
      }
    }
  }

  return map;
}

/**
 * Import Square catalog ITEM variations into Bloomer products for this shop.
 */
export async function syncSquareCatalogImportForShop(
  userId: string,
  shopId: string
): Promise<{ productsUpserted: number }> {
  const accessToken = await getSquareAccessToken(userId);
  if (!accessToken) {
    throw new Error("Square not connected");
  }

  const locationsRes = await fetch(`${getBaseUrl()}/locations`, {
    headers: SQUARE_HEADERS(accessToken),
  });
  const locationsData = (await locationsRes.json()) as {
    locations?: { id: string }[];
  };
  const locationId = locationsData.locations?.[0]?.id;

  const catalogObjects = await fetchAllCatalogItems(accessToken);
  const rows = collectVariationRows(catalogObjects);

  const variationIds = rows.map((r) => r.variationId);
  const qtyMap = locationId
    ? await fetchInventoryByVariationIds(accessToken, locationId, variationIds)
    : new Map<string, number>();

  let productsUpserted = 0;

  for (const row of rows) {
    const quantity = qtyMap.get(row.variationId) ?? 0;

    const existing = await db.product.findFirst({
      where: {
        shopId,
        squareCatalogVariationId: row.variationId,
      },
    });

    const data = {
      name: row.itemName,
      description: row.description,
      retailPrice: row.priceDollars,
      costPrice: row.priceDollars,
      quantity,
      squareCatalogItemId: row.itemId,
      squareCatalogVariationId: row.variationId,
      category: "General",
    };

    if (existing) {
      await db.product.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await db.product.create({
        data: {
          ...data,
          shopId,
        },
      });
    }
    productsUpserted += 1;
  }

  return { productsUpserted };
}

/**
 * Push Bloomer products that have no Square variation id to Square Catalog.
 */
export async function syncSquareCatalogExportForShop(
  userId: string,
  shopId: string
): Promise<{ productsExported: number }> {
  const accessToken = await getSquareAccessToken(userId);
  if (!accessToken) {
    throw new Error("Square not connected");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { defaultCurrency: true },
  });
  const currency = user?.defaultCurrency || "USD";

  const products = await db.product.findMany({
    where: {
      shopId,
      squareCatalogVariationId: null,
    },
  });

  const baseUrl = getBaseUrl();
  const headers = SQUARE_HEADERS(accessToken);
  let productsExported = 0;

  for (const p of products) {
    const idempotencyKey = `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const itemTempId = `#bloomer-item-${p.id}`;
    const varTempId = `#bloomer-var-${p.id}`;
    const amountCents = Math.max(0, Math.round(p.retailPrice * 100));

    const body = {
      idempotency_key: idempotencyKey,
      object: {
        type: "ITEM",
        id: itemTempId,
        item_data: {
          name: p.name,
          description: p.description || undefined,
          variations: [
            {
              type: "ITEM_VARIATION",
              id: varTempId,
              item_variation_data: {
                item_id: itemTempId,
                name: "Regular",
                pricing_type: "FIXED_PRICING",
                price_money: {
                  amount: amountCents,
                  currency,
                },
              },
            },
          ],
        },
      },
    };

    const res = await fetch(`${baseUrl}/catalog/object`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      catalog_object?: {
        id?: string;
        item_data?: {
          variations?: Array<{ id?: string }>;
        };
      };
      errors?: unknown;
    };

    if (!res.ok) {
      console.error("Square catalog export failed for product", p.id, data);
      continue;
    }

    const cat = data.catalog_object;
    const itemId = cat?.id;
    const varId = cat?.item_data?.variations?.[0]?.id;

    if (itemId && varId) {
      await db.product.update({
        where: { id: p.id },
        data: {
          squareCatalogItemId: itemId,
          squareCatalogVariationId: varId,
        },
      });
      productsExported += 1;
    }
  }

  return { productsExported };
}
