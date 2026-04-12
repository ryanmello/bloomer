import { NextResponse } from "next/server";
import { Webhook } from "svix";
import db from "@/lib/prisma";

// Resend webhook event types
type ResendWebhookEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
    };
  };
};

/**
 * POST /api/webhooks/resend
 * Handles Resend webhook events for email tracking
 *
 * Supported events:
 * - email.delivered: Email reached inbox
 * - email.opened: Recipient opened email
 * - email.clicked: Recipient clicked a link
 * - email.bounced: Email bounced
 * - email.complained: Marked as spam
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers);

    // Get webhook signing secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // If no webhook secret, skip verification (for development)
    let event: ResendWebhookEvent;

    if (webhookSecret) {
      // Verify webhook signature using svix
      const wh = new Webhook(webhookSecret);

      try {
        event = wh.verify(body, {
          "svix-id": headers["svix-id"],
          "svix-timestamp": headers["svix-timestamp"],
          "svix-signature": headers["svix-signature"],
        }) as ResendWebhookEvent;
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else {
      // Development mode - parse without verification
      console.warn("RESEND_WEBHOOK_SECRET not set - skipping signature verification");
      event = JSON.parse(body);
    }

    const { type, data } = event;
    const emailId = data.email_id;

    console.log(`Received Resend webhook: ${type} for email ${emailId}`);

    // Handle different event types
    switch (type) {
      case "email.delivered":
        // Email was successfully delivered
        await handleDelivered(emailId);
        break;

      case "email.opened":
        // Recipient opened the email
        await handleOpened(emailId);
        break;

      case "email.clicked":
        // Recipient clicked a link
        await handleClicked(emailId);
        break;

      case "email.bounced":
        // Email bounced
        await handleBounced(emailId);
        break;

      case "email.complained":
        // Recipient marked as spam
        await handleComplained(emailId);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Resend webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleDelivered(emailId: string) {
  // Update AutomationRun if exists
  const automationRun = await db.automationRun.findFirst({
    where: { resendEmailId: emailId },
  });

  if (automationRun) {
    await db.automationRun.update({
      where: { id: automationRun.id },
      data: { status: "delivered" },
    });
    console.log(`AutomationRun ${automationRun.id} marked as delivered`);
    return;
  }

  // Update CampaignRecipient if exists
  const campaignRecipient = await db.campaignRecipient.findFirst({
    where: { resendEmailId: emailId },
  });

  if (campaignRecipient) {
    await db.campaignRecipient.update({
      where: { id: campaignRecipient.id },
      data: { status: "Delivered" },
    });
    console.log(`CampaignRecipient ${campaignRecipient.id} marked as delivered`);
  }
}

async function handleOpened(emailId: string) {
  const now = new Date();

  // Update AutomationRun if exists
  const automationRun = await db.automationRun.findFirst({
    where: { resendEmailId: emailId },
  });

  if (automationRun) {
    // Only update if not already opened (first open)
    if (!automationRun.openedAt) {
      await db.automationRun.update({
        where: { id: automationRun.id },
        data: { openedAt: now },
      });
      console.log(`AutomationRun ${automationRun.id} opened at ${now}`);
    }
    return;
  }

  // Update CampaignRecipient if exists
  const campaignRecipient = await db.campaignRecipient.findFirst({
    where: { resendEmailId: emailId },
  });

  if (campaignRecipient) {
    // Only update if not already opened (first open)
    if (!campaignRecipient.openedAt) {
      await db.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          status: "Opened",
          openedAt: now,
        },
      });
      console.log(`CampaignRecipient ${campaignRecipient.id} opened at ${now}`);
    }
  }
}

async function handleClicked(emailId: string) {
  const now = new Date();

  // Update AutomationRun if exists
  const automationRun = await db.automationRun.findFirst({
    where: { resendEmailId: emailId },
  });

  if (automationRun) {
    // Only update if not already clicked (first click)
    if (!automationRun.clickedAt) {
      await db.automationRun.update({
        where: { id: automationRun.id },
        data: {
          clickedAt: now,
          // Also set openedAt if not already set (click implies open)
          openedAt: automationRun.openedAt || now,
        },
      });
      console.log(`AutomationRun ${automationRun.id} clicked at ${now}`);
    }
    return;
  }

  // Update CampaignRecipient if exists
  const campaignRecipient = await db.campaignRecipient.findFirst({
    where: { resendEmailId: emailId },
  });

  if (campaignRecipient) {
    // Only update if not already clicked (first click)
    if (!campaignRecipient.clickedAt) {
      await db.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          status: "Clicked",
          clickedAt: now,
          // Also set openedAt if not already set (click implies open)
          openedAt: campaignRecipient.openedAt || now,
        },
      });
      console.log(`CampaignRecipient ${campaignRecipient.id} clicked at ${now}`);
    }
  }
}

async function handleBounced(emailId: string) {
  // Update AutomationRun if exists
  const automationRun = await db.automationRun.findFirst({
    where: { resendEmailId: emailId },
  });

  if (automationRun) {
    await db.automationRun.update({
      where: { id: automationRun.id },
      data: {
        status: "bounced",
        errorMessage: "Email bounced",
      },
    });
    console.log(`AutomationRun ${automationRun.id} marked as bounced`);
    return;
  }

  // Update CampaignRecipient if exists
  const campaignRecipient = await db.campaignRecipient.findFirst({
    where: { resendEmailId: emailId },
  });

  if (campaignRecipient) {
    await db.campaignRecipient.update({
      where: { id: campaignRecipient.id },
      data: { status: "Bounced" },
    });
    console.log(`CampaignRecipient ${campaignRecipient.id} marked as bounced`);
  }
}

async function handleComplained(emailId: string) {
  // Update AutomationRun if exists
  const automationRun = await db.automationRun.findFirst({
    where: { resendEmailId: emailId },
  });

  if (automationRun) {
    await db.automationRun.update({
      where: { id: automationRun.id },
      data: {
        status: "complained",
        errorMessage: "Marked as spam",
      },
    });
    console.log(`AutomationRun ${automationRun.id} marked as spam`);
    return;
  }

  // Update CampaignRecipient if exists
  const campaignRecipient = await db.campaignRecipient.findFirst({
    where: { resendEmailId: emailId },
  });

  if (campaignRecipient) {
    await db.campaignRecipient.update({
      where: { id: campaignRecipient.id },
      data: { status: "Complained" },
    });
    console.log(`CampaignRecipient ${campaignRecipient.id} marked as spam`);
  }
}
