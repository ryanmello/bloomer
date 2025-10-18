"use client";

import { useUser } from "@/context/AuthContext";
import {
  ChevronDown,
  Columns2,
  Flower,
  Search,
  Plus,
  Settings,
  Menu,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "../ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

type Shop = {
  id: string;
  name: string;
  phone: string;
  email: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useUser();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get("/api/shop");
        if (response.data && response.data.length > 0) {
          setShops(response.data);
          setCurrentShop(response.data[0]); // Get the first shop
        }
      } catch (error) {
        console.error("Failed to fetch shops:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchShops();
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-w-0">
      <div className="flex h-12 items-center px-4 sm:px-6 gap-2 sm:gap-4 justify-between min-w-0">
        {/* Hamburger menu for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="xl:hidden transition-all duration-200 hover:scale-110 active:scale-95 -ml-2"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Left side - Shop selector */}
        <div className="flex items-center flex-shrink-0">
          {isLoading ? (
            <Skeleton className="h-8 w-40 border-[1px]" />
          ) : currentShop ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center justify-center border-[1px] rounded-md h-8 px-2 gap-2 hover:bg-secondary cursor-pointer">
                  <Flower className="w-5 h-5" />
                  <p className="font-medium text-sm">{currentShop.name}</p>
                  <ChevronDown className="text-muted-foreground w-3 h-3" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Your Shops</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {shops.map((shop) => (
                    <DropdownMenuItem
                      key={shop.id}
                      onClick={() => setCurrentShop(shop)}
                      className={currentShop.id === shop.id ? "bg-accent" : ""}
                    >
                      <Flower className="w-4 h-4" />
                      {shop.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Plus className="w-4 h-4" />
                  Create New Shop
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="w-4 h-4" />
                  Manage Shops
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* Center - Search bar (hidden on mobile) */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full h-8 text-xs"
            />
          </div>
        </div>

        {/* Right side - Search icon for mobile */}
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
