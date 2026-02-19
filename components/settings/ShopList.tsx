'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Shop {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface ShopWithCounts extends Shop {
    _count: {
        products: number;
        customers: number;
        campaigns: number;
    };
}

export default function ShopList() {
    // State for shops list
    const [shops, setShops] = useState<Shop[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [shopToDelete, setShopToDelete] = useState<ShopWithCounts | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFetchingCounts, setIsFetchingCounts] = useState(false);

    const router = useRouter();

    // Fetch all shops on component mount
    useEffect(() => {
        async function fetchShops() {
            try {
                const response = await fetch('/api/shop');
                if (response.ok) {
                    const data = await response.json();
                    setShops(data);
                }
            } catch (error) {
                console.error('Error fetching shops:', error);
                toast.error('Failed to load shops');
            } finally {
                setIsLoading(false);
            }
        }

        fetchShops();
    }, []);

    // When user clicks delete button, fetch counts and open dialog
    const handleDeleteClick = async (shop: Shop) => {
        setIsFetchingCounts(true);

        try {
            // Fetch shop with counts for the confirmation dialog
            const response = await fetch(`/api/shop/${shop.id}`);
            if (!response.ok) throw new Error('Failed to fetch shop details');

            const shopWithCounts = await response.json();
            setShopToDelete(shopWithCounts);
            setDeleteDialogOpen(true);
        } catch (error) {
            console.error('Error fetching shop details:', error);
            toast.error('Failed to load shop details');
        } finally {
            setIsFetchingCounts(false);
        }
    };

    // When user confirms deletion
    const handleConfirmDelete = async () => {
        if (!shopToDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/shop/${shopToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete shop');
            }

            const data = await response.json();

            // Remove shop from local state
            setShops(shops.filter(s => s.id !== shopToDelete.id));

            // Close dialog
            setDeleteDialogOpen(false);
            setShopToDelete(null);

            toast.success(`"${shopToDelete.name}" deleted successfully`);

            // If no shops remaining, redirect to create page
            if (data.noShopsRemaining) {
                router.push('/shop/create');
            } else {
                // Refresh to update header shop selector
                router.refresh();
            }
        } catch (error) {
            console.error('Error deleting shop:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete shop');
        } finally {
            setIsDeleting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    // No shops state
    if (shops.length === 0) {
        return (
            <div className="text-center py-4 text-muted-foreground">
                <p>No shops found.</p>
                <Button
                    variant="link"
                    onClick={() => router.push('/shop/create')}
                >
                    Create your first shop
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-2">
                {shops.map((shop) => (
                    <div
                        key={shop.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{shop.name}</p>
                                <p className="text-xs text-muted-foreground">{shop.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(shop)}
                            disabled={isFetchingCounts}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &quot;{shopToDelete?.name}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <p>This will permanently delete:</p>
                                <ul className="list-disc list-inside">
                                    <li>{shopToDelete?._count.products || 0} products</li>
                                    <li>{shopToDelete?._count.customers || 0} customers</li>
                                    <li>{shopToDelete?._count.campaigns || 0} campaigns</li>
                                </ul>
                                <p className="font-medium text-destructive">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Shop'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
