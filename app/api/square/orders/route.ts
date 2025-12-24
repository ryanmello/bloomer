// app/api/square/orders/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const SQUARE_BASE_URL = "https://connect.squareup.com/v2";

type SquareOrder = {
  id: string;
  created_at: string;
  total_money?: {
    amount: number; // in cents
    currency: string;
  };
  state: string;
};

type MonthlyRevenue = {
  month: string; // e.g., "Jan"
  year: number;
  revenue: number; // in dollars
  orders: number; // order count
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

export async function GET() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN_PROD;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Square access token not configured" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "No locations found in Square account" },
        { status: 404 }
      );
    }

    // Calculate date range for past year
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    console.log("=== SQUARE API DEBUG ===");
    console.log("Date Range:", {
      start: oneYearAgo.toISOString(),
      end: now.toISOString(),
    });
    console.log("Location IDs:", locationIds);

    // Fetch all orders from the past year (with pagination)
    let allOrders: SquareOrder[] = [];
    let cursor: string | undefined;
    let pageCount = 0;

    do {
      pageCount++;
      console.log(`\nFetching page ${pageCount}...`);
      
      const ordersRes = await axios.post(
        `${SQUARE_BASE_URL}/orders/search`,
        {
          location_ids: locationIds,
          limit: 500, // Max allowed per request
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
      const pageOrders = ordersData.orders || [];
      console.log(`Page ${pageCount} returned ${pageOrders.length} orders`);
      
      allOrders = allOrders.concat(pageOrders);
      cursor = ordersData.cursor;
      
      if (cursor) {
        console.log("Has more pages (cursor exists)");
      }
    } while (cursor);

    console.log(`\nTotal raw orders fetched: ${allOrders.length}`);

    // Log ALL raw orders received
    console.log("\n=== ALL RAW ORDERS FROM SQUARE ===");
    allOrders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log("  ID:", order.id);
      console.log("  State:", order.state);
      console.log("  Created At:", order.created_at);
      console.log("  Total Money:", order.total_money);
      console.log("  Full Order:", JSON.stringify(order, null, 2));
    });

    // Aggregate orders by month
    const { monthlyRevenue, completedOrders, skippedOrders } = aggregateOrdersByMonth(allOrders);

    console.log("\n=== ORDER PROCESSING SUMMARY ===");
    console.log(`Total orders: ${allOrders.length}`);
    console.log(`Completed orders (counted): ${completedOrders.length}`);
    console.log(`Skipped orders: ${skippedOrders.length}`);

    if (skippedOrders.length > 0) {
      console.log("\n=== SKIPPED ORDERS (NOT COMPLETED) ===");
      skippedOrders.forEach(({ order, reason }) => {
        console.log(`  Order ${order.id}: ${reason}`);
        console.log(`    Created: ${order.created_at}`);
        console.log(`    Amount: $${(order.total_money?.amount || 0) / 100}`);
      });
    }

    if (completedOrders.length > 0) {
      console.log("\n=== COMPLETED ORDERS (COUNTED) ===");
      completedOrders.forEach((order) => {
        console.log(`  Order ${order.id}:`);
        console.log(`    Created: ${order.created_at}`);
        console.log(`    State: ${order.state}`);
        console.log(`    Amount: $${(order.total_money?.amount || 0) / 100}`);
        console.log(`    Currency: ${order.total_money?.currency || "N/A"}`);
      });
    }

    console.log("\n=== END SQUARE API DEBUG ===\n");

    return NextResponse.json({
      orders: allOrders,
      monthlyRevenue,
      completedOrders,
      skippedOrders,
      locations: locationsData.locations || [],
      totalOrders: allOrders.length,
      totalCompletedOrders: completedOrders.length,
    });
  } catch (error) {
    console.error("Square API error:", error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: "Failed to connect to Square API",
          details: error.response?.data,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to connect to Square API" },
      { status: 500 }
    );
  }
}
