/**
 * Active Shop Cookie Management
 * 
 * Manages the currently active shop selection using HTTP-only cookies
 * - GET: Retrieve the active shop ID from cookie
 * - POST: Set a new active shop ID in cookie
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/actions/getCurrentUser';
import db from '@/lib/prisma';
/**
 * GET /api/shop/active
 * Retrieves the currently active shop ID from cookies
 * @returns Object with activeShopId (or null if not set)
 */
export async function GET() {
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get('activeShopId')?.value;

    return NextResponse.json({ activeShopId: activeShopId || null });
}

/**
 * POST /api/shop/active
 * Sets the active shop ID in an HTTP-only cookie
 * @param req - Request body must contain: shopId
 * @returns Success status
 */
export async function POST(req: Request) {
    try {
        const { shopId } = await req.json();

        // Validate shopId is provided
        if (!shopId) {
            return NextResponse.json(
                { error: 'Shop ID is required' },
                { status: 400 }
            );
        }

        // SECURITY: Verify the shop belongs to the authenticated user
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const shop = await db.shop.findFirst({
            where: {
                id: shopId,
                userId: user.id
            }
        });

        if (!shop) {
            return NextResponse.json(
                { error: 'Shop not found or access denied' },
                { status: 403 }
            );
        }

        // Set the cookie with security options
        const cookieStore = await cookies();
        cookieStore.set('activeShopId', shopId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting active shop:', error);
        return NextResponse.json(
            {
                error: 'Failed to set active shop',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}