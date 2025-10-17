"use client";

import { useUser } from "@/context/AuthContext";
import { ChevronDown, Columns2, Flower, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "../ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import axios from "axios";

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
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get("/api/shop");
        if (response.data && response.data.length > 0) {
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
      <div className="flex h-12 items-center justify-between px-6">
        {/* Left side - Page title */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-8 w-40 border-[1px]" />
          ) : currentShop ? (
            <div className="flex items-center justify-center border-[1px] rounded-md h-8 px-2 gap-2">
              <Flower className="w-5 h-5" />
              <p className="font-medium text-sm">{currentShop.name}</p>
              <ChevronDown className="text-muted-foreground w-3 h-3" />
            </div>
          ) : null}
        </div>

        {/* Center - Search bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 w-full h-8 text-xs"
            />
          </div>
        </div>

        {/* Right side - Notifications and user info */}
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
          </Button> */}
        </div>
      </div>
    </header>
  );
}
