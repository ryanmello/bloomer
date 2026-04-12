/**
 * Square → Bloomer customer sync: import/update customers from Square (Customers API)
 * for a shop, and refresh order-based stats per customer.
 * Used by POST /api/customer/import and POST /api/square/sync.
 */

import axios from "axios";
import db from "@/lib/prisma";
import { getSquareAccessToken } from "@/lib/square";

function getBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";
}

async function fetchOrdersForCustomer(
  accessToken: string,
  locationId: string,
  customerId: string
) {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/orders/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      location_ids: [locationId],
      query: { filter: { customer_filter: { customer_ids: [customerId] } } },
    }),
  });

  const data = await res.json();
  return Array.isArray(data.orders) ? data.orders : [];
}

type SquareCustomerPayload = {
  id?: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    administrative_district_level_1?: string;
    postal_code?: string;
    country?: string;
  };
};

/**
 * Pulls all Square customers (paginated), upserts into Bloomer for the given shop,
 * and updates spend/order counts when a Square location is available.
 */
export async function syncSquareCustomersForShop(
  userId: string,
  shopId: string
): Promise<{ customersProcessed: number }> {
  const accessToken = await getSquareAccessToken(userId);
  if (!accessToken) {
    throw new Error("Square not connected");
  }

  const baseUrl = getBaseUrl();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Square-Version": "2024-01-18",
  };

  const locationsRes = await fetch(`${baseUrl}/locations`, { headers });
  const locationsData = await locationsRes.json();
  const locationId = locationsData.locations?.[0]?.id as string | undefined;

  let customersProcessed = 0;
  let cursor: string | undefined;

  do {
    const url = new URL(`${baseUrl}/customers`);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await axios.get(url.toString(), { headers });
    const customers = (res.data.customers || []) as SquareCustomerPayload[];

    for (const c of customers) {
      if (!c.id) continue;

      const email = c.email_address || "";
      const phoneNumber = c.phone_number || "";
      const addressData = c.address
        ? [
            {
              line1: c.address.address_line_1 || "",
              line2: c.address.address_line_2 || "",
              city: c.address.locality || "",
              state: c.address.administrative_district_level_1 || "",
              zip: c.address.postal_code || "",
              country: c.address.country || "",
            },
          ]
        : [];

      const existingCustomer = await db.customer.findFirst({
        where: { squareId: c.id },
        include: { addresses: true },
      });

      let customerId: string;

      if (existingCustomer) {
        await db.customer.update({
          where: { id: existingCustomer.id },
          data: {
            firstName: c.given_name || "",
            lastName: c.family_name || "",
            email,
            phoneNumber,
            addresses: {
              deleteMany: {},
              create: addressData,
            },
          },
        });
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await db.customer.create({
          data: {
            squareId: c.id,
            firstName: c.given_name || "",
            lastName: c.family_name || "",
            email,
            phoneNumber,
            shopId,
            addresses: {
              create: addressData,
            },
          },
        });
        customerId = newCustomer.id;
      }

      if (locationId) {
        const orders = await fetchOrdersForCustomer(
          accessToken,
          locationId,
          c.id
        );
        let totalSpend = 0;

        for (const order of orders) {
          const amount =
            (order as { total_money?: { amount?: number }; net_total_money?: { amount?: number } })
              .total_money?.amount ??
            (order as { net_total_money?: { amount?: number } }).net_total_money?.amount ??
            0;
          totalSpend += amount;
        }

        const spendInDollars = totalSpend / 100;

        await db.customer.update({
          where: { id: customerId },
          data: {
            orderCount: orders.length,
            spendAmount: spendInDollars,
            occasionsCount: orders.length,
          },
        });
      }

      customersProcessed += 1;
    }

    cursor = res.data.cursor as string | undefined;
  } while (cursor);

  return { customersProcessed };
}
