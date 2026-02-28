import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { fetchSquareOrders } from "@/lib/square";

const EMPTY_RESPONSE = {
  orders: [],
  monthlyRevenue: [],
  completedOrders: [],
  skippedOrders: [],
  locations: [],
  totalOrders: 0,
  totalCompletedOrders: 0,
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    const data = await fetchSquareOrders(user.id);

    if (!data) {
      return NextResponse.json(EMPTY_RESPONSE);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Square orders API error:", error);
    return NextResponse.json(EMPTY_RESPONSE, { status: 200 });
  }
}
