import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

// Assigning a staff role to a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Find the user by email
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Update the role to "staff"
    const updatedUser = await db.user.update({
      where: { email },
      data: { role: "staff" },
    });

    return NextResponse.json({ message: "Role updated", user: updatedUser }, { status: 200 });
    
  } catch (error) {
    console.error("Assign role error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Get current user or list of staff users
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const staffOnly = url.searchParams.get("staff");

    if (staffOnly === "true") {
      // Fetch all users with role "staff"
      const staffUsers = await db.user.findMany({
        where: { role: "staff" },
        select: { name: true, email: true, role: true },
      });
      return NextResponse.json(staffUsers);
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "User not found or not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove the staff role from a user
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Remove the staff role (set role to null)
    const updatedUser = await db.user.update({
      where: { email },
      data: { role: null },
    });

    return NextResponse.json({ message: "Staff role removed", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Remove staff role error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
