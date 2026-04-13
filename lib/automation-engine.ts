import db from "@/lib/prisma";
import { sendAutomationEmail } from "@/lib/resend-email";
import {
  getCustomersForBirthdayTrigger,
  getCustomersForInactiveTrigger,
  getCustomersForNewCustomerTrigger,
  getCustomersForHolidayTrigger,
  filterByAudience,
  getAlreadySentCustomerIds,
  isHolidayTriggerDay,
  isHolidayTrigger,
  getHolidayDate,
} from "@/lib/automation-triggers";
import { canSendMarketingEmail } from "@/lib/email-rate-limit";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type AutomationResult = {
  automationId: string;
  automationName: string;
  triggerType: string;
  customersMatched: number;
  customersSkipped: number;
  customersRateLimited: number;
  emailsSent: number;
  emailsFailed: number;
  customers: Array<{
    id: string;
    email: string;
    status: "sent" | "failed" | "skipped" | "rate_limited";
    error?: string;
  }>;
};

type ProcessResult = {
  shopId: string;
  shopName: string;
  automationsProcessed: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  totalRateLimited: number;
  results: AutomationResult[];
};

/**
 * Process all active automations for a shop
 */
export async function processAutomationsForShop(
  shopId: string,
  options: { dryRun?: boolean; automationId?: string } = {}
): Promise<ProcessResult> {
  const { dryRun = false, automationId } = options;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true },
  });

  if (!shop) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  // Get active automations (or a specific one for testing)
  const whereClause: { shopId: string; status: string; id?: string } = {
    shopId,
    status: "active",
  };
  if (automationId) {
    whereClause.id = automationId;
  }

  const automations = await db.automation.findMany({
    where: whereClause,
    include: { audience: true },
  });

  const results: AutomationResult[] = [];
  let totalEmailsSent = 0;
  let totalEmailsFailed = 0;
  let totalRateLimited = 0;

  for (const automation of automations) {
    const result = await processAutomation(automation, shop.name, dryRun);
    results.push(result);
    totalEmailsSent += result.emailsSent;
    totalEmailsFailed += result.emailsFailed;
    totalRateLimited += result.customersRateLimited;
  }

  return {
    shopId: shop.id,
    shopName: shop.name,
    automationsProcessed: automations.length,
    totalEmailsSent,
    totalEmailsFailed,
    totalRateLimited,
    results,
  };
}

/**
 * Process a single automation
 */
async function processAutomation(
  automation: {
    id: string;
    name: string;
    triggerType: string;
    timing: number;
    actionType: string;
    emailSubject: string | null;
    emailBody: string | null;
    audienceId: string | null;
    targetDate: Date | null;
    targetMonth: number | null;
    targetDay: number | null;
    shopId: string;
  },
  shopName: string,
  dryRun: boolean
): Promise<AutomationResult> {
  const result: AutomationResult = {
    automationId: automation.id,
    automationName: automation.name,
    triggerType: automation.triggerType,
    customersMatched: 0,
    customersSkipped: 0,
    customersRateLimited: 0,
    emailsSent: 0,
    emailsFailed: 0,
    customers: [],
  };

  // Skip if no email content
  if (!automation.emailSubject || !automation.emailBody) {
    console.log(`Skipping automation ${automation.name}: No email content`);
    return result;
  }

  // Get matching customers based on trigger type
  let customers: Customer[] = [];

  switch (automation.triggerType) {
    case "birthday":
      customers = await getCustomersForBirthdayTrigger(
        automation.shopId,
        automation.timing
      );
      break;

    case "inactive":
      customers = await getCustomersForInactiveTrigger(
        automation.shopId,
        automation.timing
      );
      break;

    case "new_customer":
      customers = await getCustomersForNewCustomerTrigger(
        automation.shopId,
        automation.timing
      );
      break;

    case "holiday":
      if (!automation.targetMonth || !automation.targetDay) {
        console.log(`Skipping automation ${automation.name}: No target month/day for holiday`);
        return result;
      }
      // Check if today is the trigger day
      if (!isHolidayTriggerDay(automation.targetMonth, automation.targetDay, automation.timing)) {
        return result;
      }
      customers = await getCustomersForHolidayTrigger(
        automation.shopId,
        automation.targetMonth,
        automation.targetDay,
        automation.timing
      );
      break;

    default:
      // Check if it's a named holiday trigger (valentines_day, christmas, etc.)
      if (isHolidayTrigger(automation.triggerType)) {
        const holidayDate = getHolidayDate(automation.triggerType);
        if (!holidayDate) {
          console.log(`Unknown holiday trigger: ${automation.triggerType}`);
          return result;
        }
        // Check if today is the trigger day for this holiday
        if (!isHolidayTriggerDay(holidayDate.month, holidayDate.day, automation.timing)) {
          return result;
        }
        customers = await getCustomersForHolidayTrigger(
          automation.shopId,
          holidayDate.month,
          holidayDate.day,
          automation.timing
        );
        break;
      }
      console.log(`Unknown trigger type: ${automation.triggerType}`);
      return result;
  }

  // Apply audience filter if set
  customers = await filterByAudience(customers, automation.audienceId);
  result.customersMatched = customers.length;

  if (customers.length === 0) {
    return result;
  }

  // Get already sent customer IDs to prevent duplicates
  const alreadySentIds = await getAlreadySentCustomerIds(
    automation.id,
    automation.triggerType
  );

  // Filter out already sent customers first
  const customersToProcess = customers.filter((c) => !alreadySentIds.has(c.id));
  const skippedCustomers = customers.filter((c) => alreadySentIds.has(c.id));

  // Record skipped customers
  for (const customer of skippedCustomers) {
    result.customersSkipped++;
    result.customers.push({
      id: customer.id,
      email: customer.email,
      status: "skipped",
    });
  }

  // Process in batches of 50 to respect rate limits
  const batchSize = 50;
  for (let i = 0; i < customersToProcess.length; i += batchSize) {
    const batch = customersToProcess.slice(i, i + batchSize);

    for (const customer of batch) {
      if (dryRun) {
        // In dry-run mode, just record what would happen
        result.emailsSent++;
        result.customers.push({
          id: customer.id,
          email: customer.email,
          status: "sent",
        });
        continue;
      }

      // Check rate limits before sending
      // Birthday and holiday automations skip cooloff but still count toward monthly cap
      const skipCooloff = automation.triggerType === "birthday" || isHolidayTrigger(automation.triggerType);
      const rateLimitCheck = await canSendMarketingEmail(customer.id, {
        skipCooloff,
      });

      if (!rateLimitCheck.allowed) {
        // Log the rate-limited attempt
        console.log(
          `⏸️ Rate limited: ${customer.email} - ${rateLimitCheck.reason} ` +
          `(monthly: ${rateLimitCheck.monthlyCount}/5)`
        );

        await db.automationRun.create({
          data: {
            automationId: automation.id,
            customerId: customer.id,
            status: "rate_limited",
            errorMessage: `Suppressed due to ${rateLimitCheck.reason === "cooloff" ? "3-day cooloff" : "monthly cap (5/month)"}`,
          },
        });

        result.customersRateLimited++;
        result.customers.push({
          id: customer.id,
          email: customer.email,
          status: "rate_limited",
          error: `Suppressed: ${rateLimitCheck.reason}`,
        });
        continue;
      }

      // Send the email
      const emailResult = await sendAutomationEmail(
        automation.id,
        customer,
        automation.emailSubject,
        automation.emailBody,
        shopName
      );

      // Log the run with Resend email ID for webhook tracking
      await db.automationRun.create({
        data: {
          automationId: automation.id,
          customerId: customer.id,
          status: emailResult.success ? "sent" : "failed",
          errorMessage: emailResult.error,
          resendEmailId: emailResult.emailId || null,
        },
      });

      if (emailResult.success) {
        result.emailsSent++;
        result.customers.push({
          id: customer.id,
          email: customer.email,
          status: "sent",
        });
      } else {
        result.emailsFailed++;
        result.customers.push({
          id: customer.id,
          email: customer.email,
          status: "failed",
          error: emailResult.error,
        });
      }
    }

    // Delay between batches to respect rate limits (skip in dry-run)
    if (!dryRun && i + batchSize < customersToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return result;
}

/**
 * Process automations for all shops (called by cron)
 */
export async function processAllAutomations(
  options: { dryRun?: boolean } = {}
): Promise<ProcessResult[]> {
  // Get all shops that have active automations
  const shopsWithAutomations = await db.shop.findMany({
    where: {
      automations: {
        some: { status: "active" },
      },
    },
    select: { id: true },
  });

  const results: ProcessResult[] = [];

  for (const shop of shopsWithAutomations) {
    try {
      const result = await processAutomationsForShop(shop.id, options);
      results.push(result);
    } catch (error) {
      console.error(`Error processing automations for shop ${shop.id}:`, error);
    }
  }

  return results;
}
