import axios from "axios";
import db from "@/lib/prisma";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";
const SQUARE_SANDBOX_BASE_URL = "https://connect.squareupsandbox.com/v2";

function getBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? SQUARE_BASE_URL
    : SQUARE_SANDBOX_BASE_URL;
}

export type SquareOrder = {
  id: string;
  created_at: string;
  total_money?: {
    amount: number;
    currency: string;
  };
  state: string;
};

export type MonthlyRevenue = {
  month: string;
  year: number;
  revenue: number;
  orders: number;
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

    const revenueInDollars = (order.total_money?.amount || 0) / 100;
    monthlyData[monthKey].revenue += revenueInDollars;
    monthlyData[monthKey].orders += 1;
  }

  const monthlyRevenue = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, data]) => data);

  return { monthlyRevenue, completedOrders, skippedOrders };
}

/**
 * Retrieves a valid access token for the given user.
 * Refreshes the token automatically if it's expired or about to expire.
 */
export async function getSquareAccessToken(userId: string): Promise<string | null> {
  const integration = await db.squareIntegration.findUnique({
    where: { userId },
  });

  if (!integration || !integration.connected) {
    return null;
  }

  const bufferMs = 5 * 60 * 1000;
  if (integration.expiresAt.getTime() - Date.now() > bufferMs) {
    return integration.accessToken;
  }

  const isSandbox = process.env.NODE_ENV !== "production";
  const tokenUrl = isSandbox
    ? "https://connect.squareupsandbox.com/oauth2/token"
    : "https://connect.squareup.com/oauth2/token";

  const clientId = process.env.SQUARE_CLIENT_ID;
  const clientSecret = process.env.SQUARE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Square OAuth credentials not configured");
    return null;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Square token:", await response.text());
      return null;
    }

    const tokens = await response.json();

    await db.squareIntegration.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at),
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error("Square token refresh error:", error);
    return null;
  }
}

export async function fetchSquareOrders(userId: string): Promise<SquareOrdersResponse | null> {
  const accessToken = await getSquareAccessToken(userId);

  if (!accessToken) {
    console.error("No Square access token available for user:", userId);
    return null;
  }

  const baseUrl = getBaseUrl();

  const headers = {
    "Square-Version": "2024-01-18",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const locationsRes = await axios.get(`${baseUrl}/locations`, { headers });

    const locationsData = locationsRes.data;
    const locationIds =
      locationsData.locations?.map((loc: { id: string }) => loc.id) || [];

    if (locationIds.length === 0) {
      console.error("No locations found in Square account");
      return null;
    }

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    let allOrders: SquareOrder[] = [];
    let cursor: string | undefined;

    do {
      const ordersRes = await axios.post(
        `${baseUrl}/orders/search`,
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
