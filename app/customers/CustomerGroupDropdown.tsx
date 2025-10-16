"use client";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

const customerGroups: CustomerGroup[] = ["VIP", "Repeat", "New", "Potential"];

interface CustomerGroupDropdownProps {
  selectedGroups: CustomerGroup[];
  onSelectionChange: (groups: CustomerGroup[]) => void;
}

export function CustomerGroupDropdown({
  selectedGroups,
  onSelectionChange,
}: CustomerGroupDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleGroup = (group: CustomerGroup) => {
    if (selectedGroups.includes(group)) {
      onSelectionChange(selectedGroups.filter((g) => g !== group));
    } else {
      onSelectionChange([...selectedGroups, group]);
    }
  };

  const getButtonText = () => {
    if (selectedGroups.length === 0) {
      return "Select customer groups";
    }
    if (selectedGroups.length === 1) {
      return selectedGroups[0];
    }
    return `${selectedGroups.length} groups selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-[200px] justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{getButtonText()}</span>
        <ChevronDown
          className={cn(
            "size-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md z-50 animate-in fade-in-0 zoom-in-95">
          <div className="p-1">
            {customerGroups.map((group) => (
              <div
                key={group}
                className="relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => toggleGroup(group)}
              >
                <div
                  className={cn(
                    "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                    selectedGroups.includes(group)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50"
                  )}
                >
                  {selectedGroups.includes(group) && (
                    <Check className="size-3" />
                  )}
                </div>
                <span>{group}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
