import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";

export async function GET() {
  try {
    const customers = await db.customers.findMany();
    return NextResponse.json(customers || []); 
  } catch (err) {
    console.error("Error fetching customers:", err);
    return NextResponse.json([]); 
  }
}
