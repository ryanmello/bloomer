"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Customer } from "@/app/(dashboard)/customers/page";

export type SortOption =
  | "alphabetical"
  | "recent"
  | "dateAdded"
  | "orderCount"
  | "spendAmount"
  | "occasionsCount";

export type SortDirection = "asc" | "desc" | null;

interface CustomerFilterProps {
  customers: Customer[];
  onFiltered: (filtered: Customer[]) => void;
}

export default function CustomerFilter({ customers, onFiltered }: CustomerFilterProps) {
  const [filters, setFilters] = useState({
    sortBy: [] as SortOption[],
    sortDirection: null as SortDirection,
    status: null as string | null,
  });

  const lastFiltered = useRef<Customer[]>([]);

  useEffect(() => {
    let filtered = [...customers];

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (c) => c.overallStatus?.toLowerCase() === filters.status
      );
    }
    // "all" shows active + completed 
    else if (filters.status === "all") {
      filtered = filtered.filter((c) => c.overallStatus);
    }
    // null show everything, no filter
    
    if (filters.sortBy.length > 0) {
      const sortField = filters.sortBy[0];
      filtered.sort((a, b) => {
        let result = 0;
        switch (sortField) {
          case "alphabetical":
            result = a.firstName.localeCompare(b.firstName);
            break;
          case "recent":
          case "dateAdded":
            result =
              new Date(a.createdAt ?? 0).getTime() -
              new Date(b.createdAt ?? 0).getTime();
            break;
          case "orderCount":
            result = (a.orderCount ?? 0) - (b.orderCount ?? 0);
            break;
          case "spendAmount":
            result = (a.spendAmount ?? 0) - (b.spendAmount ?? 0);
            break;
          case "occasionsCount":
            result = (a.occasionsCount ?? 0) - (b.occasionsCount ?? 0);
            break;
        }
        if (filters.sortDirection === "desc") result = -result;
        return result;
      });
    }

    // Only call onFiltered if results changed
    const isSame =
      lastFiltered.current.length === filtered.length &&
      lastFiltered.current.every((c, i) => c.id === filtered[i].id);

    if (!isSame) {
      lastFiltered.current = filtered;
      onFiltered(filtered);
    }
  }, [filters, customers, onFiltered]);

  // Dropdown options
  const sortByOptions: { label: string; value: SortOption }[] = [
    { label: "Alphabetical", value: "alphabetical" },
    { label: "Recent", value: "recent" },
    { label: "Date Added", value: "dateAdded" },
    { label: "Order Count", value: "orderCount" },
    { label: "Spend Amount", value: "spendAmount" },
    { label: "Occasions Count", value: "occasionsCount" },
  ];

  const sortDirectionOptions: { label: string; value: SortDirection }[] = [
    { label: "Select asc/desc", value: null },
    { label: "Ascending", value: "asc" },
    { label: "Descending", value: "desc" },
  ];

  const statusOptions: { label: string; value: string | null }[] = [
    { label: "Select status", value: null },
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const renderMultiSelectDropdown = <T extends string>(
    selected: T[],
    items: { label: string; value: T }[],
    onSelect: (selected: T[]) => void,
    placeholder = "Select options"
  ) => {
    const toggleItem = (value: T) =>
      selected.includes(value)
        ? onSelect(selected.filter((v) => v !== value))
        : onSelect([...selected, value]);

    const getButtonText = () => {
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) return items.find((i) => i.value === selected[0])?.label;
      return `${selected.length} selected`;
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
          {items.map((item) => (
            <DropdownMenuCheckboxItem
              key={item.value ?? "none"}
              checked={selected.includes(item.value)}
              onCheckedChange={() => toggleItem(item.value)}
            >
              {item.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderSingleSelectDropdown = <T extends string | null>(
    selected: T,
    items: { label: string; value: T }[],
    onSelect: (value: T) => void,
    placeholder = "Select"
  ) => {
    const getButtonText = () => {
      if (selected === null) return placeholder;
      return items.find((i) => i.value === selected)?.label ?? placeholder;
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
          {items.map((item) => (
            <DropdownMenuItem key={item.value ?? "none"} onClick={() => onSelect(item.value)}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="flex items-center gap-4">
      {renderMultiSelectDropdown(
        filters.sortBy,
        sortByOptions,
        (value) => setFilters((prev) => ({ ...prev, sortBy: value })),
        "Select filters"
      )}

      {renderSingleSelectDropdown(
        filters.sortDirection,
        sortDirectionOptions,
        (value) => setFilters((prev) => ({ ...prev, sortDirection: value })),
        "Select asc/desc"
      )}

      {renderSingleSelectDropdown(
        filters.status,
        statusOptions,
        (value) => setFilters((prev) => ({ ...prev, status: value })),
        "Select status"
      )}
    </div>
  );
}
