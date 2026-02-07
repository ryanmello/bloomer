import {NextResponse} from "next/server";
import db from "../../../lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

// GET all audiences
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    // fetch user's shop
    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json(
        {message: "No shop found for user"},
        {status: 404}
      );
    }

    const audiences = await db.audience.findMany({
      // can’t filter by shopId yet so return all audiences
    });

    return NextResponse.json(audiences);
  } catch (error) {
    console.error("Error fetching audiences:", error);
    return NextResponse.json({ error: "Failed to fetch audiences" }, { status: 500 });
  }
}

// POST to create a new audience
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    // create audience
    const newAudience = await db.audience.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        field: body.field || null,
      },
    });

    return NextResponse.json(
      {message: "Audience created successfully!", audience: newAudience},
      {status: 201}
    );
  } catch (error) {
    console.error("Error creating audience:", error);
    return NextResponse.json(
      {error: "Failed to create audience"},
      {status: 500}
    );
  }
}
