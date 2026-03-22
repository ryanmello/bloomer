import {NextResponse, NextRequest} from "next/server";
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

    const orderData = await db.order.findMany({
      where: {
        shopId: shop.id,
        userId: user.id,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(orderData);
  } catch (err) {
    console.error("Error fetching order Data:", err);
    return NextResponse.json(
      {message: "Failed to fetch order Data"},
      {status: 500},
    );
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
    const {customerId, status, orderItems} = body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        {message: "At least one product is required"},
        {status: 400},
      );
    }

    const productIds = orderItems.map((item: any) => item.productId);

    const products = await db.product.findMany({
      where: {
        id: {in: productIds},
        shopId: shop.id,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {message: "One or more products are invalid"},
        {status: 400},
      );
    }

    let totalAmount = 0;

    const orderItemsData = orderItems.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new Error("Invalid product");
      }

      const quantity = Number(item.quantity);

      if (!quantity || quantity <= 0) {
        throw new Error("Invalid quantity");
      }

      const availableQty = Math.min(product.quantity, quantity);
      const neededQty = Math.max(quantity - product.quantity, 0);
      const unitPrice = product.retailPrice;
      const subPrice = unitPrice * quantity;
      totalAmount += subPrice;

      return {
        quantity,
        availableQty,
        neededQty,
        unitPrice,
        subPrice,
        product: {
          connect: {
            id: product.id,
          },
        },
      };
    });

    const createdOrder = await db.order.create({
      data: {
        customerId: customerId && customerId !== "walk-in" ? customerId : null,
        status: status ?? "PENDING",
        totalAmount,
        userId: user.id,
        shopId: shop.id,
        orderItems: {
          create: orderItemsData,
        },
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

    return NextResponse.json(
      {message: "Order created successfully!", createdOrder},
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({error: "Failed to create order"}, {status: 500});
  }
}
