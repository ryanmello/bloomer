import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

// Ensure this runs in Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            emailNotificationsEnabled: user.emailNotificationsEnabled,
            twoFactorEnabled: user.twoFactorEnabled
        });
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return NextResponse.json(
            { message: "Failed to fetch preferences" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { emailNotificationsEnabled } = await req.json();

        if (typeof emailNotificationsEnabled !== "boolean") {
            return NextResponse.json(
                { message: "emailNotificationsEnabled must be a boolean" },
                { status: 400 }
            );
        }

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: { emailNotificationsEnabled },
            select: {
                emailNotificationsEnabled: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Preferences updated successfully",
            emailNotificationsEnabled: updatedUser.emailNotificationsEnabled,
        });
    } catch (error) {
        console.error("Error updating user preferences:", error);
        return NextResponse.json(
            { message: "Failed to update preferences" },
            { status: 500 }
        );
    }
}