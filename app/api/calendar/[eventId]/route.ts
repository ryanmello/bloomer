import {NextResponse, NextRequest} from "next/server";
import db from "@/lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {cookies} from "next/headers";

// PUT /api/calendar/[eventId]
export async function PUT(
  req: NextRequest,
  {params}: {params: Promise<{eventId: string}>},
) {
  const {eventId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({message: "Not authenticated"}, {status: 401});

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
    const {title, start: startStr, end: endStr, notes} = body;

    if (!title)
      return NextResponse.json({message: "title is required"}, {status: 400});
    if (!startStr)
      return NextResponse.json({message: "start is required"}, {status: 400});

    const start = new Date(startStr);
    const end = new Date(endStr);

    const updated = await db.event.update({
      where: {id: eventId},
      data: {title, notes: notes ?? "", start, end},
    });

    return NextResponse.json(
      {message: "Event updated successfully!", updated},
      {status: 200},
    );
  } catch (err) {
    console.error("Error updating event:", err);
    return NextResponse.json(
      {message: "Failed to update event"},
      {status: 500},
    );
  }
}

// DELETE /api/calendar/[eventId]
export async function DELETE(
  _req: NextRequest,
  {params}: {params: Promise<{eventId: string}>},
) {
  const {eventId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({message: "Not authenticated"}, {status: 401});

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

    const found = await db.event.findFirst({
      where: {id: eventId, userId: user.id, shopId: shop.id},
    });

    if (!found) {
      return NextResponse.json({message: "Event not found"}, {status: 404});
    }

    await db.event.delete({where: {id: eventId}});
    return NextResponse.json({message: "Deleted"});
  } catch (err) {
    console.error("Error deleting event:", err);
    return NextResponse.json(
      {message: "Failed to delete event"},
      {status: 500},
    );
  }
}
