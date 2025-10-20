import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_SANDBOX_TOKEN!;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch("https://connect.squareupsandbox.com/v2/customers", {
      headers: {
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
     const data = await res.json();
    const customers = Array.isArray(data.customers) ? data.customers : [];

    for (const c of customers) {
      if (!c.id) continue;

      const name = `${c.given_name || ""} ${c.family_name || ""}`.trim();
      const email = c.email_address || "";
      const phoneNumber = c.phone_number || "";
      const addressData = c.address
        ? [{
            line1: c.address.address_line_1 || "",
            line2: c.address.address_line_2 || "",
            city: c.address.locality || "",
            state: c.address.administrative_district_level_1 || "",
            zip: c.address.postal_code || "",
            country: c.address.country || "",
          }]
        : [];

      // Check if customer already exists by squareId
      const existing = await db.customer.findFirst({ where: { squareId: c.id } });

      if (existing) {
        // Update existing customer
        await db.customer.update({
          where: { id: existing.id },
          data: {  firstName: c.given_name || "",lastName: c.family_name || "", email, phoneNumber,  
              addresses: {
              deleteMany: {},
              create: addressData,
            }, },
        });
      } else {
        // Create new customer
        await db.customer.create({
          data: { squareId: c.id, firstName: c.given_name || "",lastName: c.family_name || "", email, phoneNumber,
            addresses: {
              create: addressData,
            },}
        });
      }
    }
    return NextResponse.json({ message: "Customers imported successfully." });
  } catch (err) {
    console.error("Error importing customers:", err);
    return NextResponse.json(
      { error: "Failed to import customers" },
      { status: 500 }
    );
  }
}
