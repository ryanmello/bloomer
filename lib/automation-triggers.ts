import db from "@/lib/prisma";

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
    where: { shopId },
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
    return customers;
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
      since = new Date(0);
  }

  const runs = await db.automationRun.findMany({
    where: {
      automationId,
      status: "sent",
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
