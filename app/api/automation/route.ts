import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

/**
 * GET /api/automation
 * Fetch all automations for the active shop
 */
export async function GET() {
  try {
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

    // Verify shop belongs to user
    const shop = await db.shop.findFirst({
      where: { id: activeShopId, userId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Fetch automations for this shop
    const automations = await db.automation.findMany({
      where: { shopId: activeShopId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(
      { error: "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/automation
 * Create a new automation
 */
export async function POST(req: Request) {
  try {
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

    // Verify shop belongs to user
    const shop = await db.shop.findFirst({
      where: { id: activeShopId, userId: user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
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
      couponId,
      status
    } = body;

    // Validate required fields
    if (!name || !category || !triggerType || timing === undefined || !actionType) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, triggerType, timing, actionType" },
        { status: 400 }
      );
    }

    // Create automation
    const automation = await db.automation.create({
      data: {
        name,
        description: description || null,
        category,
        triggerType,
        timing: Number(timing),
        actionType,
        messageTemplate: messageTemplate || null,
        emailSubject: emailSubject || null,
        emailBody: emailBody || null,
        couponId: couponId || null,
        status: status || "active",
        shopId: activeShopId,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      { error: "Failed to create automation" },
      { status: 500 }
    );
  }
}
