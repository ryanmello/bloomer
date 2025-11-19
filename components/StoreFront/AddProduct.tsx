'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Package, DollarSign, Hash, TrendingUp, AlertCircle } from 'lucide-react';

export default function AddProduct() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [retailPrice, setRetailPrice] = useState('');
    const [description, setDescription] = useState('');
    const [inventoryCount, setInventoryCount] = useState('');
    const [category, setCategory] = useState('');
    const [margin, setMargin] = useState(0);
    const [profit, setProfit] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Calculate margin and profit whenever prices change
    useEffect(() => {
        const cost = parseFloat(costPrice) || 0;
        const retail = parseFloat(retailPrice) || 0;

        if (cost > 0 && retail > 0) {
            const profitAmount = retail - cost;
            const marginPercent = ((profitAmount / retail) * 100);
            setProfit(profitAmount);
            setMargin(marginPercent);
        } else {
            setProfit(0);
            setMargin(0);
        }
    }, [costPrice, retailPrice]);

    // Get margin color based on percentage
    const getMarginColor = () => {
        if (margin < 20) return 'text-red-600';
        if (margin < 40) return 'text-yellow-600';
        return 'text-green-600';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    price: parseFloat(retailPrice),
                    costPrice: parseFloat(costPrice),
                    description,
                    inventoryCount: parseInt(inventoryCount),
                    category,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create product');
            }

            // Reset form and close modal
            setIsOpen(false);
            setName('');
            setCostPrice('');
            setRetailPrice('');
            setDescription('');
            setInventoryCount('');
            setCategory('');
            setMargin(0);
            setProfit(0);

            router.refresh();
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new product to your inventory.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                Product Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Red Rose Bouquet"
                                required
                            />
                        </div>

                        {/* Pricing Section with Margin Display */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                Pricing & Margins
                            </Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="costPrice" className="text-xs text-muted-foreground">
                                        Cost Price
                                    </Label>
                                    <Input
                                        id="costPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="retailPrice" className="text-xs text-muted-foreground">
                                        Retail Price
                                    </Label>
                                    <Input
                                        id="retailPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={retailPrice}
                                        onChange={(e) => setRetailPrice(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Margin
                                    </Label>
                                    <div className={`text-2xl font-bold ${getMarginColor()}`}>
                                        {margin.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Profit Display */}
                            {profit > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    Profit per unit: <span className="font-medium">${profit.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Margin Warning */}
                            {margin > 0 && margin < 30 && (
                                <Alert className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Warning: Profit margin is low. Consider increasing retail price or finding a cheaper supplier.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Inventory and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="inventoryCount" className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    Initial Stock
                                </Label>
                                <Input
                                    id="inventoryCount"
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={inventoryCount}
                                    onChange={(e) => setInventoryCount(e.target.value)}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category" className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    Category
                                </Label>
                                <Select value={category} onValueChange={setCategory} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Roses">Roses</SelectItem>
                                        <SelectItem value="Bouquets">Bouquets</SelectItem>
                                        <SelectItem value="Arrangements">Arrangements</SelectItem>
                                        <SelectItem value="Plants">Plants</SelectItem>
                                        <SelectItem value="Wedding">Wedding</SelectItem>
                                        <SelectItem value="Funeral">Funeral</SelectItem>
                                        <SelectItem value="Seasonal">Seasonal</SelectItem>
                                        <SelectItem value="Vases">Vases & Accessories</SelectItem>
                                        <SelectItem value="Supplies">Supplies</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description
                                <span className="text-muted-foreground text-xs ml-2">(optional)</span>
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a detailed description of your product..."
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Total Value Preview */}
                        {inventoryCount && retailPrice && (
                            <div className="bg-muted rounded-lg p-3">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span>Total Cost Value:</span>
                                        <span>${(parseFloat(costPrice || '0') * parseInt(inventoryCount)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Retail Value:</span>
                                        <span>${(parseFloat(retailPrice || '0') * parseInt(inventoryCount)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-green-600 pt-1 border-t">
                                        <span>Potential Profit:</span>
                                        <span>${(profit * parseInt(inventoryCount)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isLoading}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading || margin < 0} className="gap-2">
                            {isLoading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Add Product
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}