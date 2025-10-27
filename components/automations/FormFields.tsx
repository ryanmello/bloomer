"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AutomationFormData } from "./CreateAutomationsModal";

interface FormFieldsProps {
    data: AutomationFormData;
    setData: React.Dispatch<React.SetStateAction<AutomationFormData>>;
}

export function FormFields({ data, setData }: FormFieldsProps) {
    const handleDataChange = (key: string, value: string) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {/*Automation Name */}
            <div className="col-span-1">
                <Label htmlFor="automationName">Automation Name</Label>
                <Input
                    id="automationName"
                    placeholder="e.g. Mother's Day Reminder"
                    value={data.automationName}
                    onChange={(e) => handleDataChange("automationName", e.target.value)}
                />
            </div>

            {/*Category */}
            <div className="col-span-1">
                <Label htmlFor="category">Category</Label>
                <Select
                    value={data.category}
                    onValueChange={(value) => handleDataChange("category", value)}
                >
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* These would eventually come from your API */}
                        <SelectItem value="lifecycle">Lifecycle</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/*Description */}
            <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    placeholder="Describe what this automation will do"
                    value={data.description}
                    onChange={(e) => handleDataChange("description", e.target.value)}
                />
            </div>

            {/* Additional Conditions */}
            <div className="col-span-2">
                <Label htmlFor="additionalConditions">Additional Conditions (optional)</Label>
                <Input
                    id="additionalConditions"
                    placeholder="TBD"
                    value={data.additionalConditions}
                    onChange={(e) =>
                        handleDataChange("additionalConditions", e.target.value)
                    }
                />
            </div>
        </div>
    );
}