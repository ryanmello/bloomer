"use client";

import { Input } from "@/components/ui/input";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";
import { Sparkles } from "lucide-react";

export function FormFields() {
    const form = useFormContext<AutomationFormData>();

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Name your automation
            </h3>
            <FormField
                control={form.control}
                name="automationName"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input
                                placeholder="e.g. Birthday Special, Welcome Email"
                                {...field}
                                className="text-base"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}