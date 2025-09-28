"use client";

import { useUser } from "@/context/AuthContext";
import { ChevronDown, Columns2, Flower, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "./ui/separator";

export default function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-6">
        {/* Left side - Page title */}
        <div className="flex items-center gap-4">
          {/* <Columns2 className="text-muted-foreground w-5 h-5" /> */}
          <div className="flex items-center gap-2 rounded-md cursor-pointer p-1">
            <div className="flex items-center justify-center p-1 bg-red-400 rounded-md">
              <Flower className="w-5 h-5"/>
            </div>
            <p className="font-medium text-sm text-muted-foreground">Chicky Blooms</p>
            <ChevronDown className="text-muted-foreground w-3 h-3" />
          </div>
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
