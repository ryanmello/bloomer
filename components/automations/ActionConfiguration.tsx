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
import { Mail, MessageSquare, Send } from "lucide-react";

interface ActionConfigurationProps {
    data: AutomationFormData;
    setData: React.Dispatch<React.SetStateAction<AutomationFormData>>;
}

export function ActionConfiguration({ data, setData }: ActionConfigurationProps) {
    const handleDataChange = (key: string, value: string) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center">
                <Send className="w-4 h-4 mr-2" />
                What action should be taken?
            </h3>
            <div className="grid grid-cols-3 gap-4">
                {/* Action Type */}
                <div>
                    <Label htmlFor="actionType">Action Type</Label>
                    <Select
                        value={data.actionType}
                        onValueChange={(value) => handleDataChange("actionType", value)}
                    >
                        <SelectTrigger id="actionType">
                            <SelectValue placeholder="Choose action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sendEmail">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Send Email
                                </div>
                            </SelectItem>
                            <SelectItem value="sendSms">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Send SMS
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/*Message Template */}
                <div>
                    <Label htmlFor="messageTemplate">Message Template</Label>
                    <Select
                        value={data.messageTemplate}
                        onValueChange={(value) => handleDataChange("messageTemplate", value)}
                        disabled={!data.actionType}
                    >
                        <SelectTrigger id="messageTemplate">
                            <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* These would also come from an API call */}
                            <SelectItem value="birthdaySpecial">Birthday Flower Special</SelectItem>
                            <SelectItem value="anniversaryOffer">Anniversary Offer</SelectItem>
                            <SelectItem value="quoteFollowup">Quote Follow-up</SelectItem>
                            <SelectItem value="welcomeEmail">New Customer Welcome</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="sendTo">Send To</Label>
                    <Select
                        value={data.sendTo}
                        onValueChange={(value) => handleDataChange("sendTo", value)}
                        disabled={!data.actionType}
                    >
                        <SelectTrigger id="sendTo">
                            <SelectValue placeholder="Choose audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="triggeredCustomer">Triggered Customer</SelectItem>
                            <SelectItem value="vipCustomers">VIP Customers</SelectItem>
                            <SelectItem value="newCustomers">New Customers</SelectItem>
                            <SelectItem value="recurringCustomers">Recurring Customers</SelectItem>
                            <SelectItem value="allCustomers">All Customers</SelectItem>
                            <SelectItem value="customAudience">Custom Audience</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}