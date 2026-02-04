import {NextResponse, NextRequest} from "next/server";
import db from "@/lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

// fetch audience data
export async function GET(
  _req: NextRequest,
  {params}: {params: Promise<{audienceId: string}>},
) {
  const {audienceId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json([]);
    }

    const audience = await db.audience.findFirst({
      where: {id: audienceId},
    });

    if (!audience)
      return NextResponse.json({message: "Audience not found"}, {status: 404});

    return NextResponse.json(audience || []);
  } catch (err) {
    console.error("Error fetching audience:", err);
    return NextResponse.json([]);
  }
}

// update audience data
export async function PUT(
  req: NextRequest,
  {params}: {params: Promise<{audienceId: string}>},
) {
  const {audienceId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json([]);
    }

    const body = await req.json();

    const updateAudience = await db.audience.update({
      where: {id: audienceId},
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        userId: user.id,
        shopId: shop.id,
      },
    });

    if (updateAudience)
      return NextResponse.json({
        message: "Audience updated successfully!",
      });

    return NextResponse.json(updateAudience, {status: 201});
  } catch (err) {
    console.error("Error update audience:", err);
    return NextResponse.json([]);
  }
}
