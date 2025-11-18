/**
 * Products API Routes
 * 
 * Handles product operations within the context of the active shop
 * - GET: Fetch all products for the active shop
 * - POST: Create a new product in the active shop
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';
import { cookies } from 'next/headers';

/**
 * GET /api/products
 * Retrieves all products for the currently active shop
 * Falls back to first shop if no active shop is set
 * @returns Array of products with shop information
 */
export async function GET() {
    try {
        // Authenticate the user
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the active shop ID from cookie
        const cookieStore = await cookies();
        const activeShopId = cookieStore.get('activeShopId')?.value;

        let shop;

        // Try to get the active shop if one is set
        if (activeShopId) {
            shop = await db.shop.findFirst({
                where: {
                    id: activeShopId,
                    userId: user.id  // Security: ensure shop belongs to authenticated user
                }
            });
        }

        // Fallback: if no active shop or it doesn't exist, get user's first shop
        if (!shop) {
            shop = await db.shop.findFirst({
                where: {
                    userId: user.id
                }
            });
        }

        // Return empty array if user has no shops
        if (!shop) {
            return NextResponse.json(
                { error: 'No shop found' },
                { status: 404 }
            );
        }

        // Fetch all products for this specific shop
        const products = await db.product.findMany({
            where: {
                shopId: shop.id
            },
            include: {
                shop: true // Include shop details in response
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(products);

    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch products',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/products
 * Creates a new product in the active shop
 * @param req - Request body must contain: name, price, inventoryCount
 *             Optional: description, category
 * @returns The newly created product object
 */
export async function POST(req: Request) {
    try {
        // Authenticate the user
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the active shop from cookie
        const cookieStore = await cookies();
        const activeShopId = cookieStore.get('activeShopId')?.value;

        let shop;

        // Try to get the active shop
        if (activeShopId) {
            shop = await db.shop.findFirst({
                where: {
                    id: activeShopId,
                    userId: user.id // Security: verify ownership
                }
            });
        }

        // Fallback to first shop if no active shop
        if (!shop) {
            shop = await db.shop.findFirst({
                where: {
                    userId: user.id
                }
            });
        }

        // User must have at least one shop to create products
        if (!shop) {
            return NextResponse.json(
                { error: 'No shop found. Please create a shop first.' },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const data = await req.json();

        if (!data.name || data.price === undefined || data.inventoryCount === undefined) {
            return NextResponse.json(
                { error: 'Name, price, and inventory count are required' },
                { status: 400 }
            );
        }

        // Create the product in the database
        const newProduct = await db.product.create({
            data: {
                name: data.name,
                retailPrice: parseFloat(data.price),
                costPrice: parseFloat(data.costPrice || data.price),
                quantity: parseInt(data.inventoryCount),
                description: data.description || null,
                category: data.category || "General",  // Use default instead of null
                shop: {
                    connect: { id: shop.id }  // ← Use connect instead of shopId
                }
            },
            include: {
                shop: true
            }
        });

        return NextResponse.json(newProduct, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            {
                error: 'Failed to create product',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}