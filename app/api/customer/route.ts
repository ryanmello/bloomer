import {NextResponse} from "next/server";
import db from "../../../lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json([]);
    }

    const customers = await db.customer.findMany({
      where: { shopId: shop.id },
      include: {addresses: true, orders: true},
    });

    return NextResponse.json(customers || []);
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json([]);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const {id} = body;

    if (!id) {
      return NextResponse.json(
        {error: "Customer ID is required"},
        {status: 400}
      );
    }

    await db.customer.delete({
      where: {id},
    });

    return NextResponse.json({message: "Customer deleted successfully"});
  } catch (err) {
    console.error("Error deleting customer:", err);
    return NextResponse.json(
      {error: "Failed to delete customer"},
      {status: 500}
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      additionalNote,
      addresses,
    } = body;

    if (!id) {
      return NextResponse.json(
        {error: "Customer ID is required"},
        {status: 400}
      );
    }

    const updatedCustomer = await db.customer.update({
      where: {id},
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        additionalNote,
        addresses: addresses
          ? {
              deleteMany: {},
              create: addresses,
            }
          : undefined,
      },
      include: {addresses: true},
    });

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    return NextResponse.json(
      {error: "Failed to update customer"},
      {status: 500}
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json(
        {message: "No shop found for user"},
        {status: 404}
      );
    }

    const body = await req.json();

    // check if email already exists
    const existingCustomer = await db.customer.findUnique({
      where: {email: body.email},
    });
    if (existingCustomer) {
      return NextResponse.json(
        {message: "Customer already exists!"},
        {status: 400}
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
        shopId: shop.id,
        addresses: body.address ? {create: body.address} : undefined,
        group: body.group || "new",
      },
      // After creating the customer, also return their related records.
      // Otherwise, Prisma would only return the customer fields
      include: {
        addresses: true,
      },
    });

    return NextResponse.json(
      {message: "Customer created successfully!", customer: newCustomer},
      {status: 201}
    );
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      {error: "Failed to create customer"},
      {status: 500}
    );
  }
}
