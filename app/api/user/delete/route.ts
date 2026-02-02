import { NextResponse } from "next/server";
import db from "@/lib/prisma";

// Delete a user account by email
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: {
        shops: true,
        coupons: true,
        campaigns: true,
        emailIntegrations: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Delete the user (cascade will handle related data: shops, coupons, campaigns, emailIntegrations)
    await db.user.delete({
      where: { email },
    });

    return NextResponse.json(
      { 
        message: "User account deleted successfully",
        deletedUser: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        associatedDataDeleted: {
          shops: user.shops.length,
          coupons: user.coupons.length,
          campaigns: user.campaigns.length,
          emailIntegrations: user.emailIntegrations.length,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
