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

      const firstName = c.given_name || "";
      const lastName = c.family_name || "";
      const email = c.email_address || "";
      const phoneNumber = c.phone_number || "";
      const location = c.address ? `${c.address.locality || ""}${c.address.locality && c.address.administrative_district_level_1 ? ", " : ""}${c.address.administrative_district_level_1 || ""}` : "";


      // Check if customer already exists by squareId
      const existing = await db.customer.findFirst({ where: { squareId: c.id } });

      if (existing) {
        // Update existing customer
        await db.customer.update({
          where: { id: existing.id },
          data: { firstName, lastName, email, phoneNumber, location },
        });
      } else {
        // Create new customer
        await db.customer.create({
          data: { squareId: c.id, firstName, lastName, email, phoneNumber, location },
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
