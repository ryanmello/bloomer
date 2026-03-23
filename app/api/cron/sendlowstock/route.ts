import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { sendLowStockEmail } from "@/lib/resend-email";

export async function GET() {
  try {
    const now = new Date();

    // Get all scheduled emails due
    const dueEmails = await db.scheduledEmail.findMany({
      where: { sent: false, sendAt: { lte: now } },
    });

    for (const emailRow of dueEmails) {
      try {
        const product = await db.product.findUnique({ where: { id: emailRow.productId } });
        if (!product) continue;

        // Only send if stock is still below threshold
        if (product.quantity <= (product.lowInventoryAlert ?? 10)) {
          await sendLowStockEmail(
            emailRow.userEmail,
            [{
              name: product.name,
              quantity: product.quantity,
              lowInventoryAlert: product.lowInventoryAlert ?? 10,
            }],
            emailRow.shopName
          );
        }

        // Mark as sent
        await db.scheduledEmail.update({
          where: { id: emailRow.id },
          data: { sent: true },
        });
      } catch (err) {
        console.error("Failed to send scheduled email:", err);
      }
    }

    return NextResponse.json({ success: true, sent: dueEmails.length });
  } catch (err) {
    console.error("Cron handler failed:", err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}