/**
 * Shop API Routes
 * 
 * Handles CRUD operations for shops
 * - GET: Fetch all shops for the authenticated user
 * - POST: Create a new shop
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';

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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all shops for this user
    const shops = await db.shop.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(shops);

  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shop
 * Creates a new shop for the authenticated user
 * @param req - Request body must contain: name, phone, email
 * @returns The newly created shop object
 */
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { name, phone, email } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { message: 'Name, phone, and email are required' },
        { status: 400 }
      );
    }

    // Create the shop and link it to the authenticated user
    const shop = await db.shop.create({
      data: {
        name,
        phone,
        email,
        userId: user.id,
      },
    });

    return NextResponse.json(shop, { status: 201 });

  } catch (error) {
    console.error('Error creating shop:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}