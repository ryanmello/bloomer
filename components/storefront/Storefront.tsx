'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import EditProductModal from './EditProductModal';
import AdjustQuantityModal from './AdjustQuantityModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Package, AlertTriangle, SlidersHorizontal } from 'lucide-react';

type StockFilter = 'all' | 'low' | 'out';

function getStockStatus(product: Product): 'in-stock' | 'low-stock' | 'out-of-stock' {
    const threshold = product.lowInventoryAlert ?? 10;
    if (product.quantity === 0) return 'out-of-stock';
    if (product.quantity <= threshold) return 'low-stock';
    return 'in-stock';
}

interface StorefrontTableProps {
    products: Product[];
}

export default function StorefrontTable({ products }: StorefrontTableProps) {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const filteredProducts = useMemo(() => {
        if (stockFilter === 'all') return products;
        return products.filter((p) => {
            const status = getStockStatus(p);
            if (stockFilter === 'low') return status === 'low-stock';
            if (stockFilter === 'out') return status === 'out-of-stock';
            return true;
        });
    }, [products, stockFilter]);

    const handleDelete = async (productId: string) => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete product');
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getStockBadge = (product: Product) => {
        const status = getStockStatus(product);
        if (status === 'out-of-stock') return { label: 'Out of Stock', variant: 'danger' as const };
        if (status === 'low-stock') return { label: 'Low Stock', variant: 'warning' as const };
        return { label: 'In Stock', variant: 'success' as const };
    };

    return (
        <>
            <div className="flex items-center justify-between gap-4 mb-4">
                <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                    <SelectTrigger className="w-[180px]">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by stock" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All products</SelectItem>
                        <SelectItem value="low">Low stock only</SelectItem>
                        <SelectItem value="out">Out of stock only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[250px]">Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Inventory</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Package className="h-8 w-8" />
                                        <p>
                                            {products.length === 0
                                                ? 'No products found. Add your first product to get started.'
                                                : 'No products match the selected filter.'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const stockBadge = getStockBadge(product);
                                const threshold = product.lowInventoryAlert ?? 10;
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    {product.description && (
                                                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                                            {product.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">${product.retailPrice.toFixed(2)}</div>
                                        </TableCell>
                                        <TableCell>
                                            {product.category ? (
                                                <Badge variant="outline" className="font-normal">
                                                    {product.category}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {product.quantity <= threshold && product.quantity > 0 && (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                                                )}
                                                <span className={
                                                    product.quantity === 0
                                                        ? "text-destructive font-medium"
                                                        : product.quantity <= threshold
                                                            ? "text-yellow-600 dark:text-yellow-500 font-medium"
                                                            : ""
                                                }>
                                                    {product.quantity} units
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={stockBadge.variant}>
                                                {stockBadge.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(product.updatedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAdjustingProduct(product)}
                                                >
                                                    Adjust
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    Edit
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={isDeleting}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete
                                                                <span className="font-medium"> &quot;{product.name}&quot;</span> from your inventory.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(product.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditProductModal
                product={editingProduct}
                onClose={() => {
                    setEditingProduct(null);
                    router.refresh();
                }}
            />
            <AdjustQuantityModal
                product={adjustingProduct}
                onClose={() => {
                    setAdjustingProduct(null);
                    router.refresh();
                }}
            />
        </>
    );
}