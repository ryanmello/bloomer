import {NextResponse, NextRequest} from "next/server";
import db from "@/lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {cookies} from "next/headers";

// GET /api/orders/[orderId]
export async function GET(
  _req: NextRequest,
  {params}: {params: Promise<{orderId: string}>},
) {
  const {orderId} = await params;

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

    // Return error if user has no shops
    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
        shopId: shop.id,
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({message: "Order not found"}, {status: 404});
    }

    const mappedOrder = {
      ...order,
      orderItems: order.orderItems.map((item) => {
        const currentStock = item.product?.quantity ?? 0;
        const neededQty = Math.max(item.quantity - currentStock, 0);

        return {
          ...item,
          currentStock,
          neededQty,
        };
      }),
    };

    return NextResponse.json(mappedOrder, {status: 200});
  } catch (err) {
    console.error("Error fetching order:", err);
    return NextResponse.json({message: "Failed to fetch order"}, {status: 500});
  }
}

// PATCH /api/orders/[orderId] -> update status
export async function PATCH(
  req: NextRequest,
  {params}: {params: Promise<{orderId: string}>},
) {
  const {orderId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const body = await req.json();
    const {status} = body;

    // validate input
    const validStatuses = ["PENDING", "COMPLETED", "SHIPPED", "CANCELLED"];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({message: "Invalid status"}, {status: 400});
    }

    // ensure order belongs to user & shop
    const existing = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
        shopId: shop.id,
      },
    });

    if (!existing) {
      return NextResponse.json({message: "Order not found"}, {status: 404});
    }

    const updated = await db.order.update({
      where: {id: orderId},
      data: {
        status,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(
      {message: "Order status updated", updated},
      {status: 200},
    );
  } catch (err) {
    console.error("Error updating order:", err);
    return NextResponse.json(
      {message: "Failed to update order"},
      {status: 500},
    );
  }
}

// DELETE /api/orders/[orderId]
export async function DELETE(
  _req: NextRequest,
  {params}: {params: Promise<{orderId: string}>},
) {
  const {orderId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get("activeShopId")?.value;

    let shop;

    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id,
        },
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!shop) {
      return NextResponse.json({error: "No shop found"}, {status: 404});
    }

    const found = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
        shopId: shop.id,
      },
    });

    if (!found) {
      return NextResponse.json({message: "Order not found"}, {status: 404});
    }

    await db.order.delete({
      where: {id: orderId},
    });

    return NextResponse.json(
      {message: "Order deleted successfully"},
      {status: 200},
    );
  } catch (err) {
    console.error("Error deleting order:", err);
    return NextResponse.json(
      {message: "Failed to delete order"},
      {status: 500},
    );
  }
}
