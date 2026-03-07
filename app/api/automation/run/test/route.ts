import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { processAutomationsForShop } from "@/lib/automation-engine";
import db from "@/lib/prisma";

/**
 * POST /api/automation/run/test
 *
 * Manual test endpoint for automation runs.
 * Requires user authentication.
 *
 * Body options:
 * - dryRun: boolean (default: true) - If true, doesn't actually send emails
 * - automationId: string (optional) - Test a specific automation only
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    if (!activeShopId) {
      return NextResponse.json(
        { error: "No active shop selected" },
        { status: 400 }
      );
    }

    // Verify user owns this shop
    const shop = await db.shop.findFirst({
      where: { id: activeShopId, userId: user.id },
    });
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found or access denied" },
        { status: 403 }
      );
    }

    // Parse request body
    let body: { dryRun?: boolean; automationId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine, use defaults
    }

    const dryRun = body.dryRun !== false; // Default to true for safety
    const automationId = body.automationId;

    console.log(`Starting automation test run for shop ${activeShopId}`);
    console.log(`Dry run: ${dryRun}`);
    if (automationId) {
      console.log(`Testing specific automation: ${automationId}`);
    }

    const startTime = Date.now();

    const result = await processAutomationsForShop(activeShopId, {
      dryRun,
      automationId,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dryRun,
      duration: `${duration}ms`,
      message: dryRun
        ? "Dry run completed - no emails were actually sent"
        : "Automation run completed",
      ...result,
    });
  } catch (error) {
    console.error("Error in automation test run:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/run/test
 *
 * Get preview of what would be sent (always dry-run).
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    if (!activeShopId) {
      return NextResponse.json(
        { error: "No active shop selected" },
        { status: 400 }
      );
    }

    // Verify user owns this shop
    const shop = await db.shop.findFirst({
      where: { id: activeShopId, userId: user.id },
    });
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found or access denied" },
        { status: 403 }
      );
    }

    // Check for automationId query param
    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get("automationId") || undefined;

    console.log(`Getting automation preview for shop ${activeShopId}`);

    const result = await processAutomationsForShop(activeShopId, {
      dryRun: true,
      automationId,
    });

    return NextResponse.json({
      success: true,
      dryRun: true,
      message: "Preview only - no emails sent",
      ...result,
    });
  } catch (error) {
    console.error("Error in automation preview:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
