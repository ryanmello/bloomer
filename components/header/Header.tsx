"use client";

import { useUser } from "@/context/AuthContext";
import {
  ChevronDown,
  Columns2,
  Flower,
  Search,
  Plus,
  Settings,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

export default function Header() {
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid grid-cols-3 h-12 items-center px-6 gap-4">
        {/* Left side - Shop selector */}
        <div className="flex items-center">
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

        {/* Center - Search bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full h-8 text-xs"
            />
          </div>
        </div>

        {/* Right side - Notifications and user info */}
        <div className="flex items-center justify-end gap-4">
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button> */}
        </div>
      </div>
    </header>
  );
}
