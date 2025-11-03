"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { FormField } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";

export function AutomationSettings() {
    const form = useFormContext<AutomationFormData>();

    return (
        <div className="space-y-4">
            {/* Section Title */}
            <h3 className="text-sm font-semibold flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Automation Settings
            </h3>

            <div className="space-y-3">
                {/* Activate Immediately Switch */}
                <FormField
                    control={form.control}
                    name="activateImmediately"
                    render={({ field }) => (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="activateImmediately" className="text-base">
                                    Activate Immediately
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Start this automation right away after creation.
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

                {/* Track Email Clicks Switch */}
                <FormField
                    control={form.control}
                    name="trackEmailClicks"
                    render={({ field }) => (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="trackEmailClicks" className="text-base">
                                    Track Email Clicks
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Monitor engagement metrics for emails sent.
                                </p>
                            </div>
                            <Switch
                                id="trackEmailClicks"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </div>
                    )}
                />
            </div>
        </div>
    );
}