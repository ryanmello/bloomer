import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

// Schema for creating a new automation
const automationFormSchema = z.object({
    automationName: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    triggerType: z.string().min(1, "Trigger is required"),
    timing: z.string().min(1, "Timing is required"),
    actionType: z.string().min(1, "Action is required"),
    emailTemplateId: z.string().min(1, "Template is required"),
    sendTo: z.string().min(1, "Recipient is required"),
    active: z.boolean(),
});

/**
 * @description GET /api/automations
 * Fetches a list of ALL automations (for a future dashboard)
 */
export async function GET() {
    try {
        const automations = await db.automation.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                emailTemplate: {
                    select: { name: true }, // Include the template name
                },
            },
        });
        return NextResponse.json(automations);
    } catch (error) {
        console.error("Error fetching automations:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

/**
 * @description POST /api/automations
 * Saves a new automation to the database 
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = automationFormSchema.safeParse(body);

        if (!validation.success) {
            console.error("Validation failed:", validation.error.issues);
            return new NextResponse(JSON.stringify(validation.error.issues), {
                status: 400,
            });
        }

        const data = validation.data;
        const newAutomation = await db.automation.create({
            data: {
                name: data.automationName,
                description: data.description,
                active: data.active,
                triggerType: data.triggerType,
                triggerTiming: data.timing,
                actionType: data.actionType,
                sendTo: data.sendTo,
                emailTemplateId: data.emailTemplateId,
            },
        });

        return NextResponse.json(newAutomation, { status: 201 });
    } catch (error) {
        console.error("Error creating automation:", error);
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}