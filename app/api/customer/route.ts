import { NextResponse } from "next/server";
import { db } from "../../../lib/prisma";

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: { address: true },
    });

    return NextResponse.json(customers || []);
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // check if email already exists
    const existingCustomer = await db.customer.findUnique({
      where: { email: body.email },
    });
    if (existingCustomer) {
      return NextResponse.json(
        { message: "Customer already exists!" },
        { status: 400 }
      );
    }

    // create customer
    const newCustomer = await db.customer.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        additionalNote: body.additionalNote,
        squareId: body.squareId || null,
        address: body.address ? { create: body.address } : undefined,
        group: body.group || "new"
      },
      // After creating the customer, also return their related records.
      // Otherwise, Prisma would only return the customer fields
      include: {
        address: true,
      },
    });

    return NextResponse.json(
      { message: "Customer created successfully!", customer: newCustomer },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);``
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
