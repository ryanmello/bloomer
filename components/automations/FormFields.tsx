"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";

export function FormFields() {
    const form = useFormContext<AutomationFormData>();

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                {/* Automation Name */}
                <FormField
                    control={form.control}
                    name="automationName"
                    render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>Automation Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Mother's Day Reminder" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category */}
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>Category</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="lifecycle">Lifecycle</SelectItem>
                                    <SelectItem value="follow-up">Follow-up</SelectItem>
                                    <SelectItem value="birthday">Birthday</SelectItem>
                                    <SelectItem value="anniversary">Anniversary</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Description */}
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Describe what this automation will do"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Additional Conditions */}
            <FormField
                control={form.control}
                name="additionalConditions"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Additional Conditions (optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="TBD" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}