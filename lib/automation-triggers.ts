import db from "@/lib/prisma";

/**
 * Holiday date mapping - maps trigger types to their fixed dates
 * For floating holidays (like Thanksgiving), we use approximate dates
 */
export const HOLIDAY_DATES: Record<string, { month: number; day: number }> = {
  valentines_day: { month: 2, day: 14 },
  mothers_day: { month: 5, day: 11 }, // Second Sunday in May (approximate)
  christmas: { month: 12, day: 25 },
  thanksgiving: { month: 11, day: 28 }, // Fourth Thursday in Nov (approximate)
  easter: { month: 4, day: 20 }, // Varies each year (approximate spring date)
  admin_professionals_day: { month: 4, day: 24 }, // Last Wednesday in April (approximate)
  international_womens_day: { month: 3, day: 8 },
  memorial_day: { month: 5, day: 26 }, // Last Monday in May (approximate)
  international_mens_day: { month: 11, day: 19 },
};

/**
 * Check if a trigger type is a holiday
 */
export function isHolidayTrigger(triggerType: string): boolean {
  return triggerType in HOLIDAY_DATES || triggerType === "holiday";
}

/**
 * Get holiday date for a trigger type
 */
export function getHolidayDate(triggerType: string): { month: number; day: number } | null {
  return HOLIDAY_DATES[triggerType] || null;
}

/**
 * Calculate the target date for a trigger (today + days offset)
 */
function getTargetDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Get customers whose birthday is in X days
 * Uses birthMonth and birthDay fields
 */
export async function getCustomersForBirthdayTrigger(
  shopId: string,
  daysFromNow: number
) {
  const targetDate = getTargetDate(daysFromNow);
  const targetMonth = targetDate.getMonth() + 1; // 1-12
  const targetDay = targetDate.getDate(); // 1-31

  const customers = await db.customer.findMany({
    where: {
      shopId,
      birthMonth: targetMonth,
      birthDay: targetDay,
      OR: [
        { unsubscribedAt: null },
        { unsubscribedAt: { isSet: false } }, // Field doesn't exist
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return customers;
}

/**
 * Get customers who haven't made a purchase in X days
 * Checks the most recent order date
 */
export async function getCustomersForInactiveTrigger(
  shopId: string,
  daysInactive: number
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  // Find customers whose last order was before the cutoff date
  // or who have never ordered
  const customers = await db.customer.findMany({
    where: {
      shopId,
      // Exclude unsubscribed customers (handle both null and missing field)
      OR: [
        { unsubscribedAt: null },
        { unsubscribedAt: { isSet: false } },
      ],
      AND: [
        {
          OR: [
            // Customers with orders, but none since cutoff
            {
              orders: {
                every: {
                  createdAt: { lt: cutoffDate },
                },
              },
              orderCount: { gt: 0 },
            },
            // Customers who have never ordered and were created before cutoff
            {
              orderCount: 0,
              createdAt: { lt: cutoffDate },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return customers;
}

/**
 * Get customers created X days ago (for new customer welcome emails)
 */
export async function getCustomersForNewCustomerTrigger(
  shopId: string,
  daysAgo: number
) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  // Get start and end of the target day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const customers = await db.customer.findMany({
    where: {
      shopId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      // Exclude unsubscribed customers (handle both null and missing field)
      OR: [
        { unsubscribedAt: null },
        { unsubscribedAt: { isSet: false } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return customers;
}

/**
 * Get customers for holiday trigger (X days before target date)
 * Sends to all customers (filtered by audience if set)
 * Uses targetMonth/targetDay so it works every year
 */
export async function getCustomersForHolidayTrigger(
  shopId: string,
  targetMonth: number,
  targetDay: number,
  daysBefore: number
) {
  // Calculate the trigger date (holiday minus days before)
  const today = new Date();
  const currentYear = today.getFullYear();

  // Build the holiday date for this year
  const holidayDate = new Date(currentYear, targetMonth - 1, targetDay);

  // Calculate when we should trigger (X days before holiday)
  const triggerDate = new Date(holidayDate);
  triggerDate.setDate(triggerDate.getDate() - daysBefore);

  // Check if today matches the trigger date (compare month and day)
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const triggerMonth = triggerDate.getMonth() + 1;
  const triggerDay = triggerDate.getDate();

  if (todayMonth !== triggerMonth || todayDay !== triggerDay) {
    return [];
  }

  // Return all customers for this shop (audience filtering happens later)
  const customers = await db.customer.findMany({
    where: {
      shopId,
      // Exclude unsubscribed customers (handle both null and missing field)
      OR: [
        { unsubscribedAt: null },
        { unsubscribedAt: { isSet: false } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return customers;
}

/**
 * Filter customers by audience membership
 * Returns empty array if audience is specified but not found (safety measure)
 */
export async function filterByAudience(
  customers: Array<{ id: string; firstName: string; lastName: string; email: string }>,
  audienceId: string | null
): Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>> {
  if (!audienceId) {
    return customers;
  }

  const audience = await db.audience.findUnique({
    where: { id: audienceId },
    select: { customerIds: true },
  });

  if (!audience) {
    // Audience was deleted - return empty array to prevent sending to everyone
    console.warn(`Audience ${audienceId} not found - returning empty customer list`);
    return [];
  }

  const audienceCustomerIds = new Set(audience.customerIds);
  return customers.filter((c) => audienceCustomerIds.has(c.id));
}

/**
 * Get customer IDs that have already received this automation
 * Used to prevent duplicate sends
 */
export async function getAlreadySentCustomerIds(
  automationId: string,
  triggerType: string
): Promise<Set<string>> {
  let since: Date;

  switch (triggerType) {
    case "birthday":
      // Check within current year (birthday is annual)
      since = new Date(new Date().getFullYear(), 0, 1);
      break;
    case "holiday":
      // Check within current year
      since = new Date(new Date().getFullYear(), 0, 1);
      break;
    case "new_customer":
      // New customer email should only be sent once ever
      since = new Date(0);
      break;
    case "inactive":
      // Check within last 30 days (can re-send after a month)
      since = new Date();
      since.setDate(since.getDate() - 30);
      break;
    default:
      // For named holidays (valentines_day, christmas, etc.), check within current year
      if (isHolidayTrigger(triggerType)) {
        since = new Date(new Date().getFullYear(), 0, 1);
      } else {
        since = new Date(0);
      }
  }

  const runs = await db.automationRun.findMany({
    where: {
      automationId,
      // Include all statuses that mean "already attempted" to prevent duplicates
      // sent = initial send, delivered = confirmed delivery, bounced = failed delivery
      // rate_limited = skipped due to limits (should retry), failed = send error (could retry)
      status: { in: ["sent", "delivered", "bounced"] },
      createdAt: { gte: since },
    },
    select: { customerId: true },
  });

  return new Set(runs.map((r) => r.customerId));
}

/**
 * Check if today is the trigger day for a holiday automation
 * Uses month/day so it works every year
 */
export function isHolidayTriggerDay(
  targetMonth: number,
  targetDay: number,
  daysBefore: number
): boolean {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Build the holiday date for this year
  const holidayDate = new Date(currentYear, targetMonth - 1, targetDay);

  // Calculate when we should trigger (X days before holiday)
  const triggerDate = new Date(holidayDate);
  triggerDate.setDate(triggerDate.getDate() - daysBefore);

  // Compare month and day
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const triggerMonth = triggerDate.getMonth() + 1;
  const triggerDay = triggerDate.getDate();

  return todayMonth === triggerMonth && todayDay === triggerDay;
}
