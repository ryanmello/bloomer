"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";
import { Mail, MessageSquare, Send } from "lucide-react";

export function ActionConfiguration() {
    const form = useFormContext<AutomationFormData>();

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-semibold flex items-center">
                <Send className="w-4 h-4 mr-2" />
                What action should be taken?
            </h3>
            <div className="grid grid-cols-3 gap-4">
                {/* Action Type */}
                <FormField
                    control={form.control}
                    name="actionType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Action Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose action" />
                                    </SelectTrigger>
                                </FormControl>
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Message Template */}
                <FormField
                    control={form.control}
                    name="messageTemplate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message Template</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose template" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="birthdaySpecial">Birthday Flower Special</SelectItem>
                                    <SelectItem value="anniversaryOffer">Anniversary Offer</SelectItem>
                                    <SelectItem value="quoteFollowup">Quote Follow-up</SelectItem>
                                    <SelectItem value="welcomeEmail">New Customer Welcome</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Send To */}
                <FormField
                    control={form.control}
                    name="sendTo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Send To</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose audience" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="triggeredCustomer">Triggered Customer</SelectItem>
                                    <SelectItem value="vipCustomers">VIP Customers</SelectItem>
                                    <SelectItem value="newCustomers">New Customers</SelectItem>
                                    <SelectItem value="recurringCustomers">Recurring Customers</SelectItem>
                                    <SelectItem value="allCustomers">All Customers</SelectItem>
                                    <SelectItem value="customAudience">Custom Audience</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}