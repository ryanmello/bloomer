"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

function getUtcOffset(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    return offsetPart?.value ?? "";
  } catch {
    return "";
  }
}

function buildTimezoneOptions(): TimezoneOption[] {
  const timezones = Intl.supportedValuesOf("timeZone");
  return timezones.map((tz) => {
    const offset = getUtcOffset(tz);
    return {
      value: tz,
      label: tz.replace(/_/g, " "),
      offset,
    };
  });
}

interface TimezoneSelectorProps {
  value: string | null;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

export default function TimezoneSelector({
  value,
  onChange,
  disabled = false,
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);

  const options = useMemo(() => buildTimezoneOptions(), []);

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="timezone-selector"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="size-4 shrink-0 opacity-50" />
            {selected
              ? `${selected.label} (${selected.offset})`
              : "Select timezone…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone…" />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.value} ${option.offset}`}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {option.offset}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
