"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const toggleGroup = (group: CustomerGroup, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedGroups, group]);
    } else {
      onSelectionChange(selectedGroups.filter((g) => g !== group));
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="truncate">{getButtonText()}</span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {customerGroups.map((group) => (
          <DropdownMenuCheckboxItem
            key={group}
            checked={selectedGroups.includes(group)}
            onCheckedChange={(checked) => toggleGroup(group, checked)}
          >
            {group}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
