import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { sendLowStockEmail } from "@/lib/resend-email";

export async function GET() {
  try {
    const now = new Date();

    // Find all scheduled emails that are due
    const emails = await db.scheduledEmail.findMany({
      where: {
        sent: false,
        sendAt: { lte: now },
      },
      include: {
        product: true,
      },
    });

    const batchSize = 50; 
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (email) => {
          if (!email.product) return;

          const threshold = email.product.lowInventoryAlert ?? 10;

          try {
            // Only send if product still below threshold
            if (email.product.quantity <= threshold) {
              await sendLowStockEmail(
                email.userEmail,
                [
                  {
                    name: email.product.name,
                    quantity: email.product.quantity,
                    lowInventoryAlert: threshold,
                  },
                ],
                email.shopName
              );
            }

            // Mark as sent 
            await db.scheduledEmail.update({
              where: { id: email.id },
              data: { sent: true },
            });

            sentCount++;
          } catch (err) {
            console.error(`Failed sending email for ${email.userEmail}`, err);
          }
        })
      );

      // Small delay between batches 
      if (i + batchSize < emails.length) {
        await new Promise((res) => setTimeout(res, 500)); 
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}