"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CommandItem } from "../ui/command";

interface SidebarItemProps {
  option: any;
  className: string;
}

export default function SidebarItem({
  option,
  className,
}: SidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      onClick={() => router.push(option.link)}
      className={`sidebar-item ${className}`}
    >
      <CommandItem
        className={cn(
          "flex gap-4 cursor-pointer hover:bg-primary-foreground",
          pathname == option.link && "bg-primary-foreground"
        )}
      >
        {option.icon}<p className="">{option.text}</p>
      </CommandItem>
    </div>
  );
}
