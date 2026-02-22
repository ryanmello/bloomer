/**
 * Shop API Routes
 *
 * Handles CRUD operations for shops
 * - GET: Fetch all shops for the authenticated user
 * - POST: Create a new shop
 */

import {NextResponse} from "next/server";
import db from "@/lib/prisma";
import {getCurrentUser} from "@/actions/getCurrentUser";

/**
 * GET /api/shop
 * Retrieves all shops belonging to the authenticated user
 * @returns Array of shops ordered by creation date (newest first)
 */
export async function GET() {
  try {
    // Authenticate the user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }

    // Fetch all shops for this user
    const shops = await db.shop.findMany({
      where: {userId: user.id},
      orderBy: {createdAt: "desc"},
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {status: 500},
    );
  }
}

/**
 * POST /api/shop
 * Creates a new shop for the authenticated user
 * @param req - Request body must contain: name, phone, email, address
 * @returns The newly created shop object
 */
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({message: "Unauthorized"}, {status: 401});
    }

    // Parse and validate request body
    const body = await req.json();
    const {name, phone, email, address} = body;

    if (!name || !phone || !email || !address) {
      return NextResponse.json(
        {message: "Name, phone, email, and address are required"},
        {status: 400},
      );
    }

    // Prisma database transaction -- API for running multiple operations
    const result = await db.$transaction(async (tx) => {
      // Create the shop and link it to the authenticated user
      const shop = await tx.shop.create({
        data: {
          name,
          phone,
          email,
          address,
          userId: user.id,
        },
      });

      // create predefined audience card
      const audienceExisting = await db.audience.findFirst({
        where: {shopId: shop.id, type: "predefined"},
      });
      if (!audienceExisting) {
        await tx.audience.createMany({
          data: [
            {
              name: "All Customers",
              description: "Everyone who has interacted with your store",
              status: "active",
              type: "predefined",
              shopId: shop.id,
            },
            {
              name: "New Customers",
              description: "Customers created in the last 30 days",
              status: "active",
              type: "predefined",
              shopId: shop.id,
            },
            {
              name: "Inactive Customers",
              description:
                "Haven't made a purchase in the last 90 days - win them back!",
              status: "inactive",
              type: "predefined",
              shopId: shop.id,
            },
            {
              name: "VIP Customers",
              description: "Customers in VIP group",
              status: "active",
              type: "predefined",
              shopId: shop.id,
            },
            {
              name: "High Spenders",
              description:
                "Top 20% of customers by lifetime value and purchase frequency",
              status: "active",
              type: "predefined",
              shopId: shop.id,
            },
            {
              name: "Birthday Club",
              description:
                "Customers with birthdays in the next 30 days for special offers",
              status: "active",
              type: "predefined",
              shopId: shop.id,
            },
          ],
        });
      }
    });
    return NextResponse.json(
      {message: "Created shop and predefined audiences"},
      {status: 201},
    );
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {status: 500},
    );
  }
}
