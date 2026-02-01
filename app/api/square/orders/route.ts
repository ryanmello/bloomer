// app/api/square/orders/route.ts
import { NextResponse } from "next/server";
import { fetchSquareOrders } from "@/lib/square";

export async function GET() {
  const data = await fetchSquareOrders();

  if (!data) {
    return NextResponse.json(
      { error: "Failed to fetch Square orders" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
