import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getSquareAccessToken } from "@/lib/square";

async function fetchOrders(accessToken: string, locationId: string, customerId: string) {
  const isSandbox = process.env.NODE_ENV !== "production";
  const baseUrl = isSandbox
    ? "https://connect.squareupsandbox.com/v2"
    : "https://connect.squareup.com/v2";

  const res = await fetch(`${baseUrl}/orders/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      location_ids: [locationId],
      query: { filter: { customer_filter: { customer_ids: [customerId] } } },
    }),
  });

  const data = await res.json();
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const accessToken = await getSquareAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { message: "Square not connected. Please connect your Square account in Settings." },
        { status: 400 }
      );
    }

    const shop = await db.shop.findFirst({
      where: { userId: user.id },
    });

    if (!shop) {
      return NextResponse.json(
        { message: "No shop found for user" },
        { status: 404 }
      );
    }

    const isSandbox = process.env.NODE_ENV !== "production";
    const baseUrl = isSandbox
      ? "https://connect.squareupsandbox.com/v2"
      : "https://connect.squareup.com/v2";

    // Fetch locations
    const locationsRes = await fetch(`${baseUrl}/locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const locationsData = await locationsRes.json();
    const locationId = locationsData.locations?.[0]?.id;

    // Fetch customers from Square
    const res = await fetch(`${baseUrl}/customers`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    const customers = Array.isArray(data.customers) ? data.customers : [];

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
            shopId: shop.id,
            addresses: {
              create: addressData,
            },
          },
        });
        customerId = newCustomer.id;
      }

      if (locationId) {
        const orders = await fetchOrders(accessToken, locationId, c.id);
        let totalSpend = 0;

        for (const order of orders) {
          const amount = order.total_money?.amount ?? order.net_total_money?.amount ?? 0;
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
    }

    return NextResponse.json({
      message: "Customers imported successfully.",
    });
  } catch (err) {
    console.error("Error importing customers:", err);
    return NextResponse.json(
      { error: "Failed to import customers" },
      { status: 500 }
    );
  }
}
