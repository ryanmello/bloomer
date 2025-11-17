/**
 * Individual Shop API Routes
 * 
 * Handles operations on specific shops
 * - DELETE: Remove a shop and all its products (cascade delete)
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';
import { cookies } from 'next/headers';

/**
 * DELETE /api/shop/[id]
 * Permanently deletes a shop and all associated products
 * @param req - Request object
 * @param params - Route parameters containing the shop ID
 * @returns Success message
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params (Next.js 15+ requirement)
        const { id } = await params;

        // Authenticate the user
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify the shop belongs to the authenticated user
        const shop = await db.shop.findFirst({
            where: {
                id: id,
                userId: user.id // Security: ensure shop belongs to user
            }
        });

        if (!shop) {
            return NextResponse.json(
                { error: 'Shop not found or you do not have permission to delete it' },
                { status: 404 }
            );
        }

        // Check if this was the active shop
        const cookieStore = await cookies();
        const activeShopId = cookieStore.get('activeShopId')?.value;
        const wasActiveShop = activeShopId === id;

        // Delete the shop (products will be cascade deleted due to schema)
        await db.shop.delete({
            where: { id }
        });

        // If this was the active shop, clear the cookie or set to first remaining shop
        if (wasActiveShop) {
            // Get remaining shops for this user
            const remainingShops = await db.shop.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 1
            });

            if (remainingShops.length > 0) {
                // Set first remaining shop as active
                cookieStore.set('activeShopId', remainingShops[0].id, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30,
                });
            } else {
                // No more shops, clear cookie
                cookieStore.delete('activeShopId');
            }
        }

        return NextResponse.json(
            {
                message: 'Shop deleted successfully',
                wasActiveShop
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting shop:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete shop',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}