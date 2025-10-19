import {NextResponse} from "next/server";
import {db} from "@/lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_SANDBOX_TOKEN!;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const res = await fetch(
      "https://connect.squareupsandbox.com/v2/customers",
      {
        headers: {
          Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    const customers = Array.isArray(data.customers) ? data.customers : [];

    for (const c of customers) {
      if (!c.id) continue;

      const firstName = c.given_name || "";
      const lastName = c.family_name || "";
      const email = c.email_address || "";
      const phoneNumber = c.phone_number || "";
      const addressData = c.address
        ? {
            line1: c.address.address_line_1 || "",
            line2: c.address.address_line_2 || "",
            city: c.address.locality || "",
            state: c.address.administrative_district_level_1 || "",
            zip: c.address.postal_code || "",
            country: c.address.country || "",
          }
        : null;

      // Check if customer already exists by squareId
      const existingCustomer = await db.customer.findFirst({
        where: {squareId: c.id},
        include: {address: true},
      });

      if (existingCustomer) {
        // Update existing customer
        await db.customer.update({
          where: {id: existingCustomer.id},
          data: {
            firstName,
            lastName,
            email,
            phoneNumber,
            address: addressData
              ? {
                  deleteMany: {}, // clear old address(es)
                  create: [addressData], // insert new one
                }
              : undefined,
          },
        });
      } else {
        // Create new customer with address
        await db.customer.create({
          data: {
            squareId: c.id,
            firstName,
            lastName,
            email,
            phoneNumber,
            address: addressData ? {create: [addressData]} : undefined,
          },
        });
      }
    }
    return NextResponse.json({message: "Customers imported successfully."});
  } catch (err) {
    console.error("Error importing customers:", err);
    return NextResponse.json(
      {error: "Failed to import customers"},
      {status: 500}
    );
  }
}
