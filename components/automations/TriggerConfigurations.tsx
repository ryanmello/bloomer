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

// This logic makes the "Timing" dropdown dynamic... Can be changed as well 
const timingOptions: Record<string, string[]> = {
    customerBirthday: ["7 days before", "3 days before", "1 day before", "On the day"],
    customerAnniversary: ["7 days before", "3 days before", "1 day before", "On the day"],
    abandonedQuote: ["1 hour after", "6 hours after", "24 hours after", "48 hours after"],
    firstOrder: ["Immediately", "1 day after", "3 days after"],
};

export function TriggerConfiguration() {
    const form = useFormContext<AutomationFormData>();
    const triggerType = form.watch("triggerType");
    
    const handleTriggerChange = (value: string, onChange: (value: string) => void) => {
        form.setValue("timing", ""); // Reset timing when trigger changes
        onChange(value);
    };

    const currentTimingOptions = timingOptions[triggerType] || [];

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-semibold flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                When should this automation trigger?
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Trigger Type */}
                <FormField
                    control={form.control}
                    name="triggerType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Trigger Type</FormLabel>
                            <Select 
                                value={field.value} 
                                onValueChange={(value) => handleTriggerChange(value, field.onChange)}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose trigger" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="customerBirthday">Customer Birthday</SelectItem>
                                    <SelectItem value="customerAnniversary">Customer Anniversary</SelectItem>
                                    <SelectItem value="abandonedQuote">Abandoned Quote</SelectItem>
                                    <SelectItem value="firstOrder">New Customer (First Order)</SelectItem>
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
                            <FormLabel>Timing</FormLabel>
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!triggerType}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="When to send" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {currentTimingOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
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