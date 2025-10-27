"use client";

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AutomationFormData } from "./CreateAutomationsModal";
import { CalendarDays, ShoppingCart, Users } from "lucide-react";

interface TriggerConfigurationProps {
    data: AutomationFormData;
    setData: React.Dispatch<React.SetStateAction<AutomationFormData>>;
}

// This logic makes the "Timing" dropdown dynamic... Can be changed as well 
const timingOptions: Record<string, string[]> = {
    customerBirthday: ["7 days before", "3 days before", "1 day before", "On the day"],
    customerAnniversary: ["7 days before", "3 days before", "1 day before", "On the day"],
    abandonedQuote: ["1 hour after", "6 hours after", "24 hours after", "48 hours after"],
    firstOrder: ["Immediately", "1 day after", "3 days after"],
};

export function TriggerConfiguration({ data, setData }: TriggerConfigurationProps) {
    const handleTriggerChange = (value: string) => {
        setData((prev) => ({
            ...prev,
            triggerType: value,
            timing: "", // Reset timing when trigger changes
        }));
    };

    const handleTimingChange = (value: string) => {
        setData((prev) => ({ ...prev, timing: value }));
    };

    const currentTimingOptions = timingOptions[data.triggerType] || [];

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center">
                <CalendarDays className="w-4 h-4 mr-2" />
                When should this automation trigger?
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Trigger Type */}
                <div>
                    <Label htmlFor="triggerType">Trigger Type</Label>
                    <Select value={data.triggerType} onValueChange={handleTriggerChange}>
                        <SelectTrigger id="triggerType">
                            <SelectValue placeholder="Choose trigger" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="customerBirthday">Customer Birthday</SelectItem>
                            <SelectItem value="customerAnniversary">Customer Anniversary</SelectItem>
                            <SelectItem value="abandonedQuote">Abandoned Quote</SelectItem>
                            <SelectItem value="firstOrder">New Customer (First Order)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Timing */}
                <div>
                    <Label htmlFor="timing">Timing</Label>
                    <Select
                        value={data.timing}
                        onValueChange={handleTimingChange}
                        disabled={!data.triggerType} // Disables until a trigger is selected
                    >
                        <SelectTrigger id="timing">
                            <SelectValue placeholder="When to send" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentTimingOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}