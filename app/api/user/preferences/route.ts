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
            twoFactorEnabled: user.twoFactorEnabled,
            timezone: user.timezone,
            defaultCurrency: user.defaultCurrency ?? "USD",
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

        const body = await req.json();
        const { emailNotificationsEnabled, timezone, defaultCurrency } = body;

        // Build update data from provided fields
        const data: Record<string, unknown> = {};

        if (typeof emailNotificationsEnabled === "boolean") {
            data.emailNotificationsEnabled = emailNotificationsEnabled;
        } else if (emailNotificationsEnabled !== undefined) {
            return NextResponse.json(
                { message: "emailNotificationsEnabled must be a boolean" },
                { status: 400 }
            );
        }

        if (typeof timezone === "string") {
            const validTimezones = Intl.supportedValuesOf("timeZone");
            if (!validTimezones.includes(timezone)) {
                return NextResponse.json(
                    { message: "Invalid IANA timezone" },
                    { status: 400 }
                );
            }
            data.timezone = timezone;
        } else if (timezone === null) {
            data.timezone = null;
        } else if (timezone !== undefined) {
            return NextResponse.json(
                { message: "timezone must be a string or null" },
                { status: 400 }
            );
        }

        if (typeof defaultCurrency === "string") {
            const allowedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
            if (!allowedCurrencies.includes(defaultCurrency)) {
                return NextResponse.json(
                    { message: "Invalid default currency" },
                    { status: 400 }
                );
            }
            data.defaultCurrency = defaultCurrency;
        } else if (defaultCurrency !== undefined) {
            return NextResponse.json(
                { message: "defaultCurrency must be a string" },
                { status: 400 }
            );
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { message: "No valid fields to update" },
                { status: 400 }
            );
        }

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data,
            select: {
                emailNotificationsEnabled: true,
                timezone: true,
                defaultCurrency: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Preferences updated successfully",
            emailNotificationsEnabled: updatedUser.emailNotificationsEnabled,
            timezone: updatedUser.timezone,
            defaultCurrency: updatedUser.defaultCurrency,
        });
    } catch (error) {
        console.error("Error updating user preferences:", error);
        return NextResponse.json(
            { message: "Failed to update preferences" },
            { status: 500 }
        );
    }
}