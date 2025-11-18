/**
 * Individual Product API Routes
 * 
 * Handles operations on specific products
 * - PUT: Update a product
 * - DELETE: Remove a product
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';

/**
 * PUT /api/products/[id]
 * Updates an existing product
 * @param req - Request object with product data
 * @param params - Route parameters containing the product ID
 * @returns Updated product object
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate the user
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the product and verify ownership through shop
        const existingProduct = await db.product.findUnique({
            where: { id },
            include: { shop: true }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Security: Verify the product's shop belongs to the user
        if (existingProduct.shop.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to update this product' },
                { status: 403 }
            );
        }

        // Parse and validate request body
        const data = await req.json();

        if (!data.name || data.retailPrice === undefined || data.quantity === undefined) {
            return NextResponse.json(
                { error: 'Name, retail price, and quantity are required' },
                { status: 400 }
            );
        }

        // Update the product
        const updatedProduct = await db.product.update({
            where: { id },
            data: {
                name: data.name,
                retailPrice: parseFloat(data.retailPrice),
                costPrice: parseFloat(data.costPrice || data.retailPrice),
                description: data.description || null,
                quantity: parseInt(data.quantity),
                category: data.category || "General",
            },
            include: {
                shop: true
            }
        });

        return NextResponse.json(updatedProduct);

    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            {
                error: 'Failed to update product',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/products/[id]
 * Permanently deletes a product
 * @param req - Request object
 * @param params - Route parameters containing the product ID
 * @returns Success message
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate the user
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the product and verify ownership through shop
        const existingProduct = await db.product.findUnique({
            where: { id },
            include: { shop: true }
        });

        if (!existingProduct) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Security: Verify the product's shop belongs to the user
        if (existingProduct.shop.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to delete this product' },
                { status: 403 }
            );
        }

        // Delete the product
        await db.product.delete({
            where: { id }
        });

        return NextResponse.json(
            { message: 'Product deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete product',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}