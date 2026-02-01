// lib/square.ts
import axios from "axios";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";

export type SquareOrder = {
  id: string;
  created_at: string;
  total_money?: {
    amount: number; // in cents
    currency: string;
  };
  state: string;
};

export type MonthlyRevenue = {
  month: string; // e.g., "Jan"
  year: number;
  revenue: number; // in dollars
  orders: number; // order count
};

export type SquareOrdersResponse = {
  orders: SquareOrder[];
  monthlyRevenue: MonthlyRevenue[];
  completedOrders: SquareOrder[];
  skippedOrders: { order: SquareOrder; reason: string }[];
  locations: { id: string; name?: string }[];
  totalOrders: number;
  totalCompletedOrders: number;
  error?: string;
};

function getMonthName(monthIndex: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[monthIndex];
}

function aggregateOrdersByMonth(orders: SquareOrder[]): {
  monthlyRevenue: MonthlyRevenue[];
  completedOrders: SquareOrder[];
  skippedOrders: { order: SquareOrder; reason: string }[];
} {
  const monthlyData: Record<string, MonthlyRevenue> = {};
  const completedOrders: SquareOrder[] = [];
  const skippedOrders: { order: SquareOrder; reason: string }[] = [];

  for (const order of orders) {
    // Only count completed and open orders
    if (order.state !== "COMPLETED" && order.state !== "OPEN") {
      skippedOrders.push({ order, reason: `state is "${order.state}" (not COMPLETED or OPEN)` });
      continue;
    }

    completedOrders.push(order);

    const date = new Date(order.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = getMonthName(date.getMonth());

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthName,
        year: date.getFullYear(),
        revenue: 0,
        orders: 0,
      };
    }

    // Square returns amounts in cents, convert to dollars
    const revenueInDollars = (order.total_money?.amount || 0) / 100;
    monthlyData[monthKey].revenue += revenueInDollars;
    monthlyData[monthKey].orders += 1;
  }

  // Sort by year and month, oldest first
  const monthlyRevenue = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => data);

  return { monthlyRevenue, completedOrders, skippedOrders };
}

export async function fetchSquareOrders(): Promise<SquareOrdersResponse | null> {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN_PROD;

  if (!accessToken) {
    console.error("Square access token not configured");
    return null;
  }

  const headers = {
    "Square-Version": "2024-01-18",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // First, fetch locations to get location IDs (required for orders search)
    const locationsRes = await axios.get(`${SQUARE_BASE_URL}/locations`, {
      headers,
    });

    const locationsData = locationsRes.data;
    const locationIds =
      locationsData.locations?.map((loc: { id: string }) => loc.id) || [];

    if (locationIds.length === 0) {
      console.error("No locations found in Square account");
      return null;
    }

    // Calculate date range for past year
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Fetch all orders from the past year (with pagination)
    let allOrders: SquareOrder[] = [];
    let cursor: string | undefined;

    do {
      const ordersRes = await axios.post(
        `${SQUARE_BASE_URL}/orders/search`,
        {
          location_ids: locationIds,
          limit: 500,
          return_entries: false,
          cursor,
          query: {
            filter: {
              date_time_filter: {
                created_at: {
                  start_at: oneYearAgo.toISOString(),
                  end_at: now.toISOString(),
                },
              },
            },
            sort: {
              sort_field: "CREATED_AT",
              sort_order: "ASC",
            },
          },
        },
        { headers }
      );

      const ordersData = ordersRes.data;
      allOrders = allOrders.concat(ordersData.orders || []);
      cursor = ordersData.cursor;
    } while (cursor);

    // Aggregate orders by month
    const { monthlyRevenue, completedOrders, skippedOrders } = aggregateOrdersByMonth(allOrders);

    return {
      orders: allOrders,
      monthlyRevenue,
      completedOrders,
      skippedOrders,
      locations: locationsData.locations || [],
      totalOrders: allOrders.length,
      totalCompletedOrders: completedOrders.length,
    };
  } catch (error) {
    console.error("Square API error:", error);
    return null;
  }
}

