import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_SANDBOX_TOKEN!;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID!;

// Fetch orders for a customer
async function fetchOrders(customerId: string) {
  const res = await fetch("https://connect.squareupsandbox.com/v2/orders/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      location_ids: [SQUARE_LOCATION_ID],
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

    // Get the user's shop
    const shop = await db.shop.findFirst({
      where: { userId: user.id }
    });

    if (!shop) {
      return NextResponse.json(
        { message: "No shop found for user" },
        { status: 404 }
      );
    }

    // Fetch customers from Square
    const res = await fetch("https://connect.squareupsandbox.com/v2/customers", {
      headers: {
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    const customers = Array.isArray(data.customers) ? data.customers : [];

    const result: { customerId: string; orderCount: number }[] = [];

    for (const c of customers) {
      if (!c.id) continue;

      const name = `${c.given_name || ""} ${c.family_name || ""}`.trim();
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

      // Check if customer already exists by squareId
      const existingCustomer = await db.customer.findFirst({
        where: { squareId: c.id },
        include: { addresses: true },
      });

      let customerId: string;

      if (existingCustomer) {
        // Update existing customer
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
        // Create new customer with address
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

      // Fetch orders, spend, occasions
      const orders = await fetchOrders(c.id);
      const orderCount = orders.length;
      let totalSpend = 0;

      for (const order of orders) {
        const amount = order.total_money?.amount ?? order.net_total_money?.amount ?? 0;
        totalSpend += amount;
      }

      const spendInDollars = totalSpend / 100;
      const occasions = orderCount; 

      await db.customer.update({
        where: { id: customerId },
        data: {  orderCount: orders.length,             
                 spendAmount: spendInDollars,         
                 occasionsCount: orders.length },
      });
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
