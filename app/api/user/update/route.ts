import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      address1,
      address2,
      city,
      state,
      country,
      postal,
      phone,
    } = await request.json();

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !address1 ||
      !city ||
      !state ||
      !country ||
      !postal
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update user details
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        firstName,
        lastName,
        address1,
        address2: address2 || null,
        city,
        state,
        country,
        postal,
        phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account details updated successfully",
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address1: updatedUser.address1,
        address2: updatedUser.address2,
        city: updatedUser.city,
        state: updatedUser.state,
        country: updatedUser.country,
        postal: updatedUser.postal,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return NextResponse.json(
      { message: "Failed to update account details" },
      { status: 500 }
    );
  }
}
