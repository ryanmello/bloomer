"use client";

import { Mail, Ticket, Eye, EyeOff } from "lucide-react";
import { AutomationFormData } from "./CreateAutomationsModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Coupon } from "@/types/coupon";

const triggerNames: Record<string, string> = {
    // Customer-based
    birthday: "Birthday",
    anniversary: "Anniversary",
    inactive: "Inactive Customer",
    new_customer: "New Customer",
    // Holidays
    valentines_day: "Valentine's Day",
    mothers_day: "Mother's Day",
    christmas: "Christmas",
    thanksgiving: "Thanksgiving",
    easter: "Easter",
    admin_professionals_day: "Admin Professionals Day",
    international_womens_day: "International Women's Day",
    memorial_day: "Memorial Day",
    international_mens_day: "International Men's Day",
};

const timingLabels: Record<string, string> = {
    "0": "on the day",
    "1": "1 day before",
    "3": "3 days before",
    "5": "5 days before",
    "7": "7 days before",
    "30": "after 30 days",
    "60": "after 60 days",
    "90": "after 90 days",
};

// Preview merge tags with sample data
function previewMergeTags(content: string, shopName: string): string {
    return content
        .replace(/\{\{firstName\}\}/g, 'Jane')
        .replace(/\{\{lastName\}\}/g, 'Smith')
        .replace(/\{\{email\}\}/g, 'jane@example.com')
        .replace(/\{\{shopName\}\}/g, shopName);
}

interface PreviewDisplayProps {
    data: AutomationFormData;
    shopName?: string;
    coupon?: Coupon;
}

export function PreviewDisplay({ data, shopName = 'Your Shop', coupon }: PreviewDisplayProps) {
    const [showPreview, setShowPreview] = useState(true);

    // Only show if we have email content
    if (!data.emailBody) {
        return null;
    }

    const trigger = triggerNames[data.triggerType] || data.triggerType;
    const timing = timingLabels[data.timing] || data.timing;

    return (
        <div className="space-y-3">
            {/* Summary bar */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-4 text-sm">
                    <span><strong>Trigger:</strong> {trigger} · {timing}</span>
                    {coupon && (
                        <span className="flex items-center gap-1">
                            <Ticket className="w-3 h-3" />
                            <strong>{coupon.codeName}</strong> ({coupon.discount}% off)
                        </span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs"
                >
                    {showPreview ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
            </div>

            {/* Email preview */}
            {showPreview && (
                <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                    <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">Email Preview</span>
                    </div>
                    <div className="p-4">
                        {data.emailSubject && (
                            <div className="mb-3 pb-3 border-b">
                                <p className="text-xs text-muted-foreground mb-1">Subject</p>
                                <p className="font-bold text-gray-900 text-base">{previewMergeTags(data.emailSubject, shopName)}</p>
                            </div>
                        )}
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: previewMergeTags(data.emailBody || '', shopName) }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}