import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

// GET all products
export async function GET() {
    const products = await db.product.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
}

// POST (create) a new product
export async function POST(req: Request) {
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
}