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
    const { name, phone, email } = body;

    // Validate required fields
    if (!name || !phone || !email) {
      return NextResponse.json(
        { message: "Name, phone, and email are required" },
        { status: 400 }
      );
    }

    // Create the shop
    const shop = await db.shop.create({
      data: {
        name,
        phone,
        email,
        userId: user.id,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error("Create shop error:", error);
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

    // Get all shops for the current user
    const shops = await db.shop.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Get shops error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

