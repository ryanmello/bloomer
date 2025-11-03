"use client";

import { Wand } from "lucide-react";
import { AutomationFormData } from "./CreateAutomationsModal";

const triggerNames: Record<string, string> = {
    customerBirthday: "Customer Birthday",
    customerAnniversary: "Customer Anniversary",
    abandonedQuote: "Abandoned Quote",
    firstOrder: "New Customer (First Order)",
};

const templateNames: Record<string, string> = {
    birthdaySpecial: "Birthday Flower Special",
    anniversaryOffer: "Anniversary Offer",
    quoteFollowup: "Quote Follow-up",
    welcomeEmail: "New Customer Welcome",
};

const recipientNames: Record<string, string> = {
    triggeredCustomer: "Triggered Customer",
    vipCustomers: "VIP Customers",
    newCustomers: "New Customers",
    recurringCustomers: "Recurring Customers",
    allCustomers: "All Customers",
    customAudience: "Custom Audience",
};

interface PreviewDisplayProps {
    data: AutomationFormData;
}

export function PreviewDisplay({ data }: PreviewDisplayProps) {
    // Only show the preview if we have the basics
    if (!data.triggerType || !data.actionType || !data.messageTemplate || !data.sendTo) {
        return null; // Don't show preview until form is partially filled
    }

    const friendlyTrigger = triggerNames[data.triggerType] || data.triggerType;
    const friendlyTemplate = templateNames[data.messageTemplate] || data.messageTemplate;
    const recipientText = recipientNames[data.sendTo] || data.sendTo;
    const triggerText = `${data.timing || '...'} ${friendlyTrigger}`;
    const actionText = `Send ${data.actionType === 'sendEmail' ? 'email' : 'SMS'} with "${friendlyTemplate}" template`;

    return (
        <div className="space-y-3 rounded-lg border bg-primary/5 p-5">
            <h3 className="text-sm font-semibold flex items-center">
                <Wand className="w-4 h-4 mr-2" />
                Preview: {data.automationName || "New Automation"}
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
                <p>
                    <strong>Trigger:</strong> <span className="text-primary">{triggerText}</span>
                </p>
                <p>
                    <strong>Action:</strong> <span className="text-primary">{actionText}</span>
                </p>
                <p>
                    <strong>Recipient:</strong> <span className="text-primary">{recipientText}</span>
                </p>
            </div>
        </div>
    );
}