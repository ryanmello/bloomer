import { NextRequest, NextResponse } from "next/server";
import { processAllAutomations } from "@/lib/automation-engine";

/**
 * POST /api/automation/run
 *
 * Cron endpoint to process all active automations.
 * Called daily by Vercel Cron or external cron service.
 *
 * Security: Requires CRON_SECRET header for authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends Authorization: Bearer <token>)
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const providedSecret = authHeader?.replace("Bearer ", "");
    if (providedSecret !== expectedSecret) {
      console.warn("Unauthorized automation run attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting automation run...");
    const startTime = Date.now();

    const results = await processAllAutomations({ dryRun: false });

    const duration = Date.now() - startTime;
    const totalEmails = results.reduce((sum, r) => sum + r.totalEmailsSent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.totalEmailsFailed, 0);

    console.log(`Automation run completed in ${duration}ms`);
    console.log(`Shops processed: ${results.length}`);
    console.log(`Total emails sent: ${totalEmails}`);
    console.log(`Total emails failed: ${totalFailed}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      shopsProcessed: results.length,
      totalEmailsSent: totalEmails,
      totalEmailsFailed: totalFailed,
      results,
    });
  } catch (error) {
    console.error("Error in automation run:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/automation/run
 *
 * Also supports GET for Vercel Cron compatibility.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
