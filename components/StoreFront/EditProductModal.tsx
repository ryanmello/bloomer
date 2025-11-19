'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditProductModalProps {
    product: Product | null;
    onClose: () => void;
}

export default function EditProductModal({ product, onClose }: EditProductModalProps) {
    // Internal form state
    const [name, setName] = useState('');
    const [retailPrice, setRetailPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Use useEffect to update form state when the product prop changes
    useEffect(() => {
        if (product) {
            setName(product.name);
            setRetailPrice(product.retailPrice.toString());
            setCostPrice(product.costPrice.toString());
            setDescription(product.description || '');
            setQuantity(product.quantity.toString());
            setCategory(product.category || '');
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return; // Should never happen if modal is open

        setIsLoading(true);
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    retailPrice: parseFloat(retailPrice),
                    costPrice: parseFloat(costPrice),
                    description,
                    quantity: parseInt(quantity),
                    category,
                }),
            });

            if (!res.ok) throw new Error('Failed to update product');
            onClose(); // Close the modal
            router.refresh(); // Refresh the page data
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // The Dialog's `open` prop is controlled by the existence of `product`
    const isOpen = !!product;

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Product: {product?.name}</DialogTitle>
                    <DialogDescription>
                        Make changes to the product and save.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="retailPrice" className="text-right col-span-2">
                                    Retail Price
                                </Label>
                                <Input
                                    id="retailPrice"
                                    type="number"
                                    step="0.01"
                                    value={retailPrice}
                                    onChange={(e) => setRetailPrice(e.target.value)}
                                    className="col-span-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="costPrice" className="text-right col-span-2">
                                    Cost Price
                                </Label>
                                <Input
                                    id="costPrice"
                                    type="number"
                                    step="0.01"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    className="col-span-2"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="quantity" className="text-right col-span-2">
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    step="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="col-span-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right col-span-2">
                                    Category
                                </Label>
                                <Input
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="col-span-2"
                                    placeholder="e.g., Bouquet"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}