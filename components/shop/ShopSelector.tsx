/**
 * Shop Selector Component
 * 
 * Dropdown component for switching between user's shops
 * - Displays all shops owned by the user
 * - Persists selection in HTTP-only cookie
 * - Reloads page when shop is changed to refresh all data
 * - Shows loading state while fetching shops
 * - Includes link to create new shop
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Flower, Plus, Settings, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Shop {
    id: string;
    name: string;
    phone?: string;
    email?: string;
}

interface ShopSelectorProps {
    variant?: 'default' | 'compact';
}

export default function ShopSelector({ variant = 'default' }: ShopSelectorProps) {
    // State management
    const [shops, setShops] = useState<Shop[]>([]);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /**
     * Load shops and active shop on component mount
     */
    useEffect(() => {
        async function loadShops() {
            try {
                // Fetch all user's shops
                const shopsRes = await fetch('/api/shop');
                const shopsData = await shopsRes.json();
                setShops(shopsData);

                // Get the currently active shop from cookie
                const activeRes = await fetch('/api/shop/active');
                const activeData = await activeRes.json();

                // Set active shop, defaulting to first shop if none is set
                const activeId = activeData.activeShopId || shopsData[0]?.id;
                setActiveShopId(activeId);

                // If no active shop was set in cookie, set the first one
                if (!activeData.activeShopId && shopsData[0]?.id) {
                    await fetch('/api/shop/active', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shopId: shopsData[0].id }),
                    });
                }
            } catch (error) {
                console.error('Error loading shops:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadShops();
    }, []);

    /**
     * Handle shop selection change
     * Updates the cookie and reloads the page to fetch new shop's data
     */
    const handleShopChange = async (shopId: string) => {
        try {
            // Update the active shop cookie
            const response = await fetch('/api/shop/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId }),
            });

            if (!response.ok) {
                throw new Error('Failed to update active shop');
            }

            setActiveShopId(shopId);

            // Force full page reload to ensure all components fetch data for the new shop
            // This is necessary because products, stats, etc. are all shop-specific
            window.location.reload();
        } catch (error) {
            console.error('Error changing shop:', error);
            // TODO: Show toast notification to user
        }
    };

    // Loading state
    if (isLoading) {
        return <Skeleton className="h-8 w-40 border-[1px]" />;
    }

    // Don't render if user has no shops
    if (shops.length === 0) {
        return null;
    }

    // Find the currently active shop to display its name
    const currentShop = shops.find(shop => shop.id === activeShopId);

    return (
        <DropdownMenu>
            {/* Dropdown trigger button */}
            <DropdownMenuTrigger asChild>
                <div className="flex items-center justify-center border-[1px] rounded-md h-8 px-2 gap-2 hover:bg-secondary cursor-pointer">
                    <Flower className="w-5 h-5" />
                    <p className="font-medium text-sm">{currentShop?.name || 'Select shop'}</p>
                    <ChevronDown className="text-muted-foreground w-3 h-3" />
                </div>
            </DropdownMenuTrigger>

            {/* Dropdown menu content */}
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Your Shops</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* List of user's shops */}
                <DropdownMenuGroup>
                    {shops.map((shop) => (
                        <DropdownMenuItem
                            key={shop.id}
                            onClick={() => handleShopChange(shop.id)}
                            className={activeShopId === shop.id ? "bg-accent" : ""}
                        >
                            <Flower className="w-4 h-4" />
                            {shop.name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Actions */}
                <DropdownMenuItem onClick={() => router.push('/shop/create')}>
                    <Plus className="w-4 h-4" />
                    Create New Shop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="w-4 h-4" />
                    Manage Shops
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}