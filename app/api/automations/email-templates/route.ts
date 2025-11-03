import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * @description GET /api/automations/email-templates
 * This function handles fetching the list of email templates
 * to populate your "Message Template" dropdown.
 */
export async function GET() {
    try {
        const templates = await db.emailTemplate.findMany({
            orderBy: {
                name: "asc", // Sort them alphabetically
            },
            select: {
                id: true, // The ID will be the 'value'
                name: true, // The 'name' is the label shown to the user
            },
        });
        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}