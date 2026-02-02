// app/api/square/orders/route.ts
import { NextResponse } from "next/server";
import { fetchSquareOrders } from "@/lib/square";

export async function GET() {
  try {
    const data = await fetchSquareOrders();

    if (!data) {
      // Square not configured or API error - return empty structure so clients don't get 500
      return NextResponse.json({
        orders: [],
        monthlyRevenue: [],
        completedOrders: [],
        skippedOrders: [],
        locations: [],
        totalOrders: 0,
        totalCompletedOrders: 0,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Square orders API error:", error);
    return NextResponse.json(
      {
        orders: [],
        monthlyRevenue: [],
        completedOrders: [],
        skippedOrders: [],
        locations: [],
        totalOrders: 0,
        totalCompletedOrders: 0,
      },
      { status: 200 }
    );
  }
}
