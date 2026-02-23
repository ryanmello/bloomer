"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";
import { CalendarDays } from "lucide-react";

// Timing options based on trigger type
const timingOptions: Record<string, { label: string; value: string }[]> = {
    // Customer-based triggers
    birthday: [
        { label: "7 days before", value: "7" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
        { label: "On the day", value: "0" },
    ],
    anniversary: [
        { label: "7 days before", value: "7" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
        { label: "On the day", value: "0" },
    ],
    inactive: [
        { label: "After 30 days", value: "30" },
        { label: "After 60 days", value: "60" },
        { label: "After 90 days", value: "90" },
    ],
    new_customer: [
        { label: "Immediately", value: "0" },
        { label: "1 day after", value: "1" },
        { label: "3 days after", value: "3" },
    ],
    // Holiday triggers - same timing for all
    valentines_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    mothers_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    christmas: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    thanksgiving: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    easter: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    admin_professionals_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    international_womens_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    memorial_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
    international_mens_day: [
        { label: "7 days before", value: "7" },
        { label: "5 days before", value: "5" },
        { label: "3 days before", value: "3" },
        { label: "1 day before", value: "1" },
    ],
};

// Auto-set category based on trigger
const triggerToCategory: Record<string, string> = {
    // Customer-based
    birthday: "lifecycle",
    anniversary: "lifecycle",
    inactive: "marketing",
    new_customer: "lifecycle",
    // Holidays
    valentines_day: "marketing",
    mothers_day: "marketing",
    christmas: "marketing",
    thanksgiving: "marketing",
    easter: "marketing",
    admin_professionals_day: "marketing",
    international_womens_day: "marketing",
    memorial_day: "marketing",
    international_mens_day: "marketing",
};

export function TriggerConfiguration() {
    const form = useFormContext<AutomationFormData>();
    const triggerType = form.watch("triggerType");

    const handleTriggerChange = (value: string) => {
        form.setValue("triggerType", value);
        form.setValue("timing", ""); // Reset timing
        form.setValue("category", triggerToCategory[value] || "lifecycle"); // Auto-set category
    };

    const currentTimingOptions = timingOptions[triggerType] || [];

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-semibold flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                When should this trigger?
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Trigger Type */}
                <FormField
                    control={form.control}
                    name="triggerType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={handleTriggerChange}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select event" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {/* Customer-based triggers */}
                                    <SelectItem value="birthday">Customer Birthday</SelectItem>
                                    <SelectItem value="anniversary">Customer Anniversary</SelectItem>
                                    <SelectItem value="new_customer">New Customer</SelectItem>
                                    <SelectItem value="inactive">Inactive Customer</SelectItem>
                                    {/* Holiday triggers */}
                                    <SelectItem value="valentines_day">Valentine&apos;s Day (Feb 14)</SelectItem>
                                    <SelectItem value="mothers_day">Mother&apos;s Day (May)</SelectItem>
                                    <SelectItem value="christmas">Christmas (Dec 25)</SelectItem>
                                    <SelectItem value="thanksgiving">Thanksgiving (Nov)</SelectItem>
                                    <SelectItem value="easter">Easter (Spring)</SelectItem>
                                    <SelectItem value="admin_professionals_day">Admin Professionals Day (Apr)</SelectItem>
                                    <SelectItem value="international_womens_day">International Women&apos;s Day (Mar 8)</SelectItem>
                                    <SelectItem value="memorial_day">Memorial Day (May)</SelectItem>
                                    <SelectItem value="international_mens_day">International Men&apos;s Day (Nov 19)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Timing */}
                <FormField
                    control={form.control}
                    name="timing"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>When</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!triggerType}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={triggerType ? "Select timing" : "Select event first"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currentTimingOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}