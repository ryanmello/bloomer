import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';

/**
 * GET /api/shop/[id]
 * Get shop details including counts of related data
 * Used to show "This will delete X products, Y customers, Z campaigns"
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const shop = await db.shop.findFirst({
            where: {
                id,
                userId: user.id
            },
            include: {
                _count: {
                    select: {
                        products: true,
                        customers: true,
                        campaigns: true,
                    }
                }
            }
        });

        if (!shop) {
            return NextResponse.json(
                { error: 'Shop not found or access denied' },
                { status: 404 }
            );
        }

        return NextResponse.json(shop);

    } catch (error) {
        console.error('Error fetching shop:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shop' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/shop/[id]
 * Deletes a shop and all related data (products, customers, campaigns)
 * Clears active shop cookie if the deleted shop was active
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify shop exists and belongs to user
        const shop = await db.shop.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!shop) {
            return NextResponse.json(
                { error: 'Shop not found or access denied' },
                { status: 403 }
            );
        }

        // Delete the shop (cascade handles products, customers, campaigns, inventory movements)
        await db.shop.delete({
            where: { id }
        });

        // Check if deleted shop was the active shop
        const cookieStore = await cookies();
        const activeShopId = cookieStore.get('activeShopId')?.value;

        if (activeShopId === id) {
            // Find another shop to set as active
            const nextShop = await db.shop.findFirst({
                where: { userId: user.id }
            });

            if (nextShop) {
                // Set the next shop as active
                cookieStore.set('activeShopId', nextShop.id, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30,
                });
            } else {
                // No shops left, clear the cookie
                cookieStore.delete('activeShopId');
            }
        }

        return NextResponse.json({
            message: 'Shop deleted successfully',
            deletedShopId: id,
            // Let frontend know if they need to redirect
            noShopsRemaining: !(await db.shop.findFirst({ where: { userId: user.id } }))
        });

    } catch (error) {
        console.error('Error deleting shop:', error);
        return NextResponse.json(
            { error: 'Failed to delete shop' },
            { status: 500 }
        );
    }
}
