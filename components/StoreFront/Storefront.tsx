'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

// Define the type for a single product
type Product = {
    id: string;
    name: string;
    price: number;
    description?: string; // Make optional if it can be null
    inventoryCount: number;
    lastUpdated: string; // Or Date
};

// Apply the type to the 'product' prop
function ProductRow({ product }: { product: Product }) {

    const handleEdit = () => {
        // STATIC: Just log to the console
        console.log('Edit product:', product.id);
        // LATER: This will open form modal
    };

    const handleDelete = () => {
        // STATIC: Just log to the console
        console.log('Delete product:', product.id);
        // LATER: This will call your DELETE API
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>${product.price?.toFixed(2)}</TableCell>
            <TableCell>{product.description}</TableCell>
            <TableCell>{product.inventoryCount}</TableCell>
            <TableCell>
                {new Date(product.lastUpdated).toLocaleDateString()}
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                    Edit
                </Button>
            </TableCell>
        </TableRow>
    );
}
export default function StorefrontTable({ products }: { products: Product[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Inventory</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product: Product) => (
                        <ProductRow key={product.id} product={product} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}