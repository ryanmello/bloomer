import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';

// PUT (update) a product
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const data = await req.json();
    const updatedProduct = await db.product.update({
        where: { id: params.id },
        data: {
            name: data.name,
            price: parseFloat(data.price),
            description: data.description,
            inventoryCount: parseInt(data.inventoryCount),
        },
    });
    return NextResponse.json(updatedProduct);
}

// DELETE a product
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await db.product.delete({
        where: { id: params.id },
    });
    return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
}