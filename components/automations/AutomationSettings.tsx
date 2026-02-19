"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";

export function AutomationSettings() {
    const form = useFormContext<AutomationFormData>();

    return (
        <FormField
            control={form.control}
            name="activateImmediately"
            render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="activateImmediately" className="text-base font-medium">
                            Activate Immediately
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Start sending emails right away
                        </p>
                    </div>
                    <Switch
                        id="activateImmediately"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                </div>
            )}
        />
    );
}