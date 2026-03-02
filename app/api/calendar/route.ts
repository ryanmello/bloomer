import {NextResponse} from "next/server";
import db from "../../../lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {cookies} from "next/headers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    // Get the active shop ID from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    // Try to get the active shop if one is set
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id, // Security: ensure shop belongs to authenticated user
        },
      });
    }

    // Fallback: if no active shop or it doesn't exist, get user's first shop
    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    // Return empty array if user has no shops
    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const event = await db.event.findMany({
      where: {shopId: shop.id, userId: user.id},
    });

    return NextResponse.json(event || []);
  } catch (err) {
    console.error("Error fetching event:", err);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    // Get the active shop ID from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    // Try to get the active shop if one is set
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id, // Security: ensure shop belongs to authenticated user
        },
      });
    }

    // Fallback: if no active shop or it doesn't exist, get user's first shop
    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    // Return empty array if user has no shops
    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const body = await req.json();
    const title = body.title;
    const startStr = body.start;
    const endStr = body.end;
    const notes = body.notes;

    if (!title)
      return NextResponse.json({message: "title is required"}, {status: 400});
    if (!startStr)
      return NextResponse.json({message: "start is required"}, {status: 400});

    const start = new Date(startStr);
    const end = new Date(endStr);

    const createdEvent = await db.event.create({
      data: {
        title,
        notes,
        start,
        end,
        userId: user.id,
        shopId: shop.id,
      },
    });

    return NextResponse.json(
      {message: "Event created successfully!", createdEvent},
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({error: "Failed to create event"}, {status: 500});
  }
}
