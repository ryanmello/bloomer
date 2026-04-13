import {NextResponse} from "next/server";
import db from "../../../lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {cookies} from "next/headers";
import {parseISO} from "date-fns";
import {createAuditLog} from "@/lib/audit";
import {createCustomerSchema} from "@/lib/validations/customer";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const customers = await db.customer.findMany({
      where: {shopId: shop.id},
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const body = await req.json();
    const {id} = body;

    if (!id) {
      return NextResponse.json(
        {error: "Customer ID is required"},
        {status: 400},
      );
    }

    await db.customer.delete({
      where: {id},
    });

    await createAuditLog({
      action: "CUSTOMER_DELETE",
      userId: user.id,
      targetId: id,
      targetType: "Customer",
    });

    return NextResponse.json({message: "Customer deleted successfully"});
  } catch (err) {
    console.error("Error deleting customer:", err);
    return NextResponse.json(
      {error: "Failed to delete customer"},
      {status: 500},
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const body = await req.json();
    const {
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      additionalNote,
      addresses,
    } = body;

    if (!id) {
      return NextResponse.json(
        {error: "Customer ID is required"},
        {status: 400},
      );
    }

    const dob =
      dateOfBirth && dateOfBirth.trim() !== "" ? parseISO(dateOfBirth) : null;

    const updatedCustomer = await db.customer.update({
      where: {id},
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        additionalNote,
        dateOfBirth: dob,
        birthMonth: dob ? dob.getMonth() + 1 : null,
        birthDay: dob ? dob.getDate() : null,
        addresses: addresses
          ? {
              deleteMany: {},
              create: addresses,
            }
          : undefined,
      },
      include: {addresses: true},
    });

    await createAuditLog({
      action: "CUSTOMER_UPDATE",
      userId: user.id,
      targetId: id,
      targetType: "Customer",
      metadata: {
        email: updatedCustomer.email,
        name: `${updatedCustomer.firstName} ${updatedCustomer.lastName}`,
      },
    });

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    return NextResponse.json(
      {error: "Failed to update customer"},
      {status: 500},
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const body = await req.json();

    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({message: firstError}, {status: 400});
    }

    const validated = parsed.data;

    const existingCustomer = await db.customer.findUnique({
      where: {email: validated.email},
    });
    if (existingCustomer) {
      return NextResponse.json(
        {message: "Customer already exists!"},
        {status: 400},
      );
    }

    const dob = validated.dateOfBirth
      ? new Date(validated.dateOfBirth)
      : null;

    const newCustomer = await db.customer.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        phoneNumber: validated.phoneNumber,
        additionalNote: validated.additionalNote,
        squareId: body.squareId || null,
        shopId: shop.id,
        addresses: validated.address
          ? {create: [validated.address]}
          : undefined,
        group: body.group || "new",

        dateOfBirth: dob,
        birthMonth: dob ? dob.getMonth() + 1 : null,
        birthDay: dob ? dob.getDate() : null,
      },
      include: {
        addresses: true,
      },
    });

    await createAuditLog({
      action: "CUSTOMER_CREATE",
      userId: user.id,
      targetId: newCustomer.id,
      targetType: "Customer",
      metadata: {
        email: newCustomer.email,
        name: `${newCustomer.firstName} ${newCustomer.lastName}`,
      },
    });

    return NextResponse.json(
      {message: "Customer created successfully!", customer: newCustomer},
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      {error: "Failed to create customer"},
      {status: 500},
    );
  }
}
