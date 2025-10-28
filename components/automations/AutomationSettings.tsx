"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { AutomationFormData } from "./CreateAutomationsModal";

// Define the props this component expects
interface AutomationSettingsProps {
    data: AutomationFormData; // The current form data
    setData: React.Dispatch<React.SetStateAction<AutomationFormData>>; // The function to update the form data
}

export function AutomationSettings({ data, setData }: AutomationSettingsProps) {

    // A single function to handle both switches
    const handleSwitchChange = (key: "activateImmediately" | "trackEmailClicks", value: boolean) => {
        // Update the specific key in the form data state
        setData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            {/* Section Title */}
            <h3 className="text-sm font-semibold flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Automation Settings
            </h3>

            {/* Activate Immediately Switch */}
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
                    checked={data.activateImmediately} // The switch is on/off based on the form data
                    onCheckedChange={(value) => handleSwitchChange("activateImmediately", value)} // Call the handler on change
                />
            </div>

            {/* Track Email Clicks Switch */}
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
                    checked={data.trackEmailClicks} // The switch is on/off based on the form data
                    onCheckedChange={(value) => handleSwitchChange("trackEmailClicks", value)} // Call the same handler
                />
            </div>
        </div>
    );
}