/**
 * Header Component
 * 
 * Main navigation header for the application
 * - Displays shop selector (synced via cookies)
 * - Search bar (desktop) and search icon (mobile)
 * - Hamburger menu for mobile navigation
 * - Sticky positioning at top of viewport
 */

"use client";

import { useUser } from "@/context/AuthContext";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ShopSelector from "@/components/shop/ShopSelector";

type HeaderProps = {
  onMenuClick?: () => void; // Callback for mobile menu toggle
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-w-0">
      <div className="flex h-12 items-center px-4 sm:px-6 gap-2 sm:gap-4 justify-between min-w-0">

        {/* Mobile hamburger menu button (hidden on xl+ screens) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="xl:hidden transition-all duration-200 hover:scale-110 active:scale-95 -ml-2"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Shop selector - only shown when user is authenticated */}
        <div className="flex items-center flex-shrink-0">
          {user && <ShopSelector />}
        </div>

        {/* Search bar - hidden on mobile, shown on md+ screens */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full h-8 text-xs"
            />
          </div>
        </div>

        {/* Mobile search icon - shown on mobile, hidden on md+ screens */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}