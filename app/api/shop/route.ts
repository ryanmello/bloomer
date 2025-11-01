import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { db } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "User not found or not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if a shop already exists for this user
    const existingShop = await db.shop.findFirst({
      where: { userId: user.id }
    });

    if (existingShop) {
      // Update the existing shop
      const updatedShop = await db.shop.update({
        where: { id: existingShop.id },
        data: { name, phone, email, address } as any,
      });
      return NextResponse.json(updatedShop, { status: 200 });
    }

    // Create a new shop if none exists
    const shop = await db.shop.create({
      data: { userId: user.id, name, phone, email, address } as any,
    });

    return NextResponse.json(shop, { status: 201 });

  } catch (error) {
    console.error("Create/update shop error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "User not found or not authenticated" },
        { status: 401 }
      );
    }

    const shop = await db.shop.findFirst({
      where: { userId: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
      } as any,
    });

    // Return empty object if no shop exists
    return NextResponse.json(shop || {});

  } catch (error) {
    console.error("Get shop error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
