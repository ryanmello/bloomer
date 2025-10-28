"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CommandItem } from "../ui/command";

interface SidebarItemProps {
  option: any;
  className: string;
  disabled?: boolean;
  onItemClick?: () => void;
}

export default function SidebarItem({
  option,
  className,
  disabled = false,
  onItemClick,
}: SidebarItemProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (!disabled) {
      router.push(option.link);
      onItemClick?.();
    }
  };

  const isActive = pathname === option.link;

  return (
    <div onClick={handleClick} className={`sidebar-item ${className}`}>
      <CommandItem
        className={cn(
          "flex gap-4 cursor-pointer transition-all duration-200",
          !disabled && "hover:bg-accent hover:text-accent-foreground",
          !disabled &&
            isActive &&
            "bg-accent text-accent-foreground font-medium",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {option.icon}
        <p className="">{option.text}</p>
      </CommandItem>
    </div>
  );
}
