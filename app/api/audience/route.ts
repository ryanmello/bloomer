import {NextResponse} from "next/server";
import db from "../../../lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

// fetch audiences card
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json(
        {message: "No shop found for user"},
        {status: 404},
      );
    }

    // fetch all audiences including their customerIds array
    const audiences = await db.audience.findMany({
      where: {shopId: shop.id},
    });

    return NextResponse.json(audiences || []);
  } catch (err) {
    console.error("Error fetching audience:", err);
    return NextResponse.json([], {status: 500});
  }
}

// create audiences
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json(
        {message: "No shop found for user"},
        {status: 404},
      );
    }

    const body = await req.json();

    // include the new customerIds field if provided
    const newAudience = await db.audience.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        field: body.field || null,
        customerIds: body.customerIds || [],
        userId: user.id,
        shopId: shop.id,
      },
    });

    return NextResponse.json(
      {message: "Audience created successfully!", audience: newAudience},
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating audience:", error);
    return NextResponse.json(
      {error: "Failed to create audience"},
      {status: 500},
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids, id } = body; 

    if ((!id && (!ids || ids.length === 0))) {
      return NextResponse.json(
        { error: "Audience ID(s) are required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const shop = await db.shop.findFirst({ where: { userId: user.id } });
    if (!shop) {
      return NextResponse.json({ message: "No shop found for user" }, { status: 404 });
    }

    if (ids && ids.length > 0) {
      await db.audience.deleteMany({
        where: { id: { in: ids }, shopId: shop.id },
      });
      return NextResponse.json(
        { message: "Audiences deleted successfully!" },
        { status: 200 }
      );
    } else if (id) {
      const audience = await db.audience.findFirst({ where: { id, shopId: shop.id } });
      if (!audience) {
        return NextResponse.json({ message: "Audience not found" }, { status: 404 });
      }
      await db.audience.delete({ where: { id } });
      return NextResponse.json(
        { message: "Audience deleted successfully!" },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Error deleting audience:", err);
    return NextResponse.json(
      { message: "Failed to delete audience" },
      { status: 500 }
    );
  }
}
