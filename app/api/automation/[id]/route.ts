import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

/**
 * PUT /api/automation/[id]
 * Update an existing automation
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    if (!activeShopId) {
      return NextResponse.json({ error: "No active shop selected" }, { status: 400 });
    }

    // Verify automation exists and belongs to user's shop
    const existingAutomation = await db.automation.findFirst({
      where: { id, shopId: activeShopId },
      include: { shop: true },
    });

    if (!existingAutomation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    if (existingAutomation.shop.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const {
      name,
      description,
      category,
      triggerType,
      timing,
      actionType,
      messageTemplate,
      emailSubject,
      emailBody,
      status
    } = body;

    // Update automation
    const automation = await db.automation.update({
      where: { id },
      data: {
        name: name ?? existingAutomation.name,
        description: description !== undefined ? description : existingAutomation.description,
        category: category ?? existingAutomation.category,
        triggerType: triggerType ?? existingAutomation.triggerType,
        timing: timing !== undefined ? Number(timing) : existingAutomation.timing,
        actionType: actionType ?? existingAutomation.actionType,
        messageTemplate: messageTemplate !== undefined ? messageTemplate : existingAutomation.messageTemplate,
        emailSubject: emailSubject !== undefined ? emailSubject : existingAutomation.emailSubject,
        emailBody: emailBody !== undefined ? emailBody : existingAutomation.emailBody,
        status: status ?? existingAutomation.status,
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error("Error updating automation:", error);
    return NextResponse.json(
      { error: "Failed to update automation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/automation/[id]
 * Delete an automation
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    if (!activeShopId) {
      return NextResponse.json({ error: "No active shop selected" }, { status: 400 });
    }

    // Verify automation exists and belongs to user's shop
    const existingAutomation = await db.automation.findFirst({
      where: { id, shopId: activeShopId },
      include: { shop: true },
    });

    if (!existingAutomation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    if (existingAutomation.shop.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete automation
    await db.automation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Automation deleted successfully" });
  } catch (error) {
    console.error("Error deleting automation:", error);
    return NextResponse.json(
      { error: "Failed to delete automation" },
      { status: 500 }
    );
  }
}
