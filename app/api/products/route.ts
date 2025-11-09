import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

// GET all products
export async function GET() {
    try {
        const products = await db.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST (create) a new product
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const newProduct = await db.product.create({
            data: {
                name: data.name,
                price: parseFloat(data.price),
                description: data.description,
                inventoryCount: parseInt(data.inventoryCount),
            },
        });
        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
