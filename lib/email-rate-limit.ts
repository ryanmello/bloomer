import db from "@/lib/prisma";

// Rate limiting configuration
const COOLOFF_DAYS = 3;
const MONTHLY_CAP = 5;

export type RateLimitResult = {
  allowed: boolean;
  reason?: "cooloff" | "monthly_cap";
  lastSentAt?: Date;
  monthlyCount?: number;
};

/**
 * Check if a marketing email can be sent to a customer
 *
 * Rules:
 * - 3-day cooloff period between marketing emails
 * - Max 5 marketing emails per month
 * - Birthday and holiday automations can skip cooloff (pass skipCooloff: true)
 * - Transactional emails should not call this function
 */
export async function canSendMarketingEmail(
  customerId: string,
  options: { skipCooloff?: boolean } = {}
): Promise<RateLimitResult> {
  const { skipCooloff = false } = options;

  const now = new Date();
  const cooloffDate = new Date(now.getTime() - COOLOFF_DAYS * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get recent marketing emails from both campaigns and automations
  const [recentCampaignEmails, recentAutomationEmails] = await Promise.all([
    // Campaign emails sent to this customer
    db.campaignRecipient.findMany({
      where: {
        customerId,
        status: { in: ["Sent", "Delivered", "Opened", "Clicked"] },
        sentAt: { gte: monthStart },
      },
      select: { sentAt: true },
      orderBy: { sentAt: "desc" },
    }),
    // Automation emails sent to this customer
    db.automationRun.findMany({
      where: {
        customerId,
        status: { in: ["sent", "delivered"] },
        createdAt: { gte: monthStart },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Combine and count monthly emails
  const allSentDates = [
    ...recentCampaignEmails.map((e) => e.sentAt).filter(Boolean),
    ...recentAutomationEmails.map((e) => e.createdAt),
  ] as Date[];

  const monthlyCount = allSentDates.length;

  // Check monthly cap first
  if (monthlyCount >= MONTHLY_CAP) {
    return {
      allowed: false,
      reason: "monthly_cap",
      monthlyCount,
    };
  }

  // Check cooloff period (unless skipped for birthday, etc.)
  if (!skipCooloff && allSentDates.length > 0) {
    // Find the most recent send
    const lastSentAt = allSentDates.reduce((latest, date) =>
      date > latest ? date : latest
    );

    if (lastSentAt > cooloffDate) {
      return {
        allowed: false,
        reason: "cooloff",
        lastSentAt,
        monthlyCount,
      };
    }
  }

  return {
    allowed: true,
    monthlyCount,
  };
}

/**
 * Get rate limit status for a customer (for UI display)
 */
export async function getCustomerRateLimitStatus(customerId: string) {
  const result = await canSendMarketingEmail(customerId);

  const now = new Date();
  const cooloffDate = new Date(now.getTime() - COOLOFF_DAYS * 24 * 60 * 60 * 1000);

  return {
    canReceiveEmail: result.allowed,
    reason: result.reason,
    monthlyCount: result.monthlyCount ?? 0,
    monthlyLimit: MONTHLY_CAP,
    cooloffDays: COOLOFF_DAYS,
    cooloffEndsAt: result.lastSentAt
      ? new Date(result.lastSentAt.getTime() + COOLOFF_DAYS * 24 * 60 * 60 * 1000)
      : null,
  };
}

// Export config for reference
export const RATE_LIMIT_CONFIG = {
  cooloffDays: COOLOFF_DAYS,
  monthlyCap: MONTHLY_CAP,
};
