"use client";

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { AutomationFormData } from "./CreateAutomationsModal";
import { Mail, Ticket, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Coupon } from "@/types/coupon";

// Template configurations - optimized for open rates
// Research: 2-4 word subjects perform best, personalization +26-50% open rates
const TEMPLATES = {
    // Customer-based templates
    birthday: {
        subject: "{{firstName}}, your birthday gift from {{shopName}}",
        color: "#e91e63",
        heading: "Happy Birthday, {{firstName}}!",
        message: "We hope your special day is filled with joy and beautiful flowers! As a birthday gift from {{shopName}}, enjoy",
    },
    welcome: {
        subject: "Welcome to {{shopName}}, {{firstName}}!",
        color: "#4caf50",
        heading: "Welcome, {{firstName}}!",
        message: "Thank you for joining {{shopName}}. We're thrilled to have you! As a welcome gift, enjoy",
    },
    winback: {
        subject: "{{firstName}}, we miss you at {{shopName}}",
        color: "#ff9800",
        heading: "We Miss You, {{firstName}}!",
        message: "It's been a while since your last visit to {{shopName}}. Come back and enjoy",
    },
    anniversary: {
        subject: "{{firstName}}, celebrate your anniversary with {{shopName}}",
        color: "#9c27b0",
        heading: "Happy Anniversary, {{firstName}}!",
        message: "Celebrate your special day with a beautiful arrangement from {{shopName}}. Enjoy",
    },
    // Holiday templates
    valentines_day: {
        subject: "{{firstName}}, say it with flowers this Valentine's Day",
        color: "#e91e63",
        heading: "Valentine's Day is Coming!",
        message: "Show your love with a stunning arrangement from {{shopName}}. Order early and enjoy",
    },
    mothers_day: {
        subject: "{{firstName}}, make Mom smile with {{shopName}}",
        color: "#ec407a",
        heading: "Mother's Day is Around the Corner!",
        message: "Celebrate the special woman in your life with beautiful flowers from {{shopName}}. Enjoy",
    },
    christmas: {
        subject: "{{firstName}}, festive florals from {{shopName}}",
        color: "#c62828",
        heading: "Spread Holiday Cheer!",
        message: "Brighten your home or gift someone special with festive arrangements from {{shopName}}. Enjoy",
    },
    thanksgiving: {
        subject: "{{firstName}}, centerpieces for your Thanksgiving table",
        color: "#ff8f00",
        heading: "Thanksgiving is Here!",
        message: "Create a warm gathering with beautiful centerpieces from {{shopName}}. Enjoy",
    },
    easter: {
        subject: "{{firstName}}, spring blooms from {{shopName}}",
        color: "#7cb342",
        heading: "Happy Easter!",
        message: "Celebrate the season with fresh spring flowers from {{shopName}}. Enjoy",
    },
    admin_professionals_day: {
        subject: "{{firstName}}, thank your team with {{shopName}}",
        color: "#5c6bc0",
        heading: "Admin Professionals Day!",
        message: "Show appreciation for the people who keep things running with flowers from {{shopName}}. Enjoy",
    },
    international_womens_day: {
        subject: "{{firstName}}, celebrate the women in your life",
        color: "#ab47bc",
        heading: "Happy International Women's Day!",
        message: "Honor the incredible women around you with flowers from {{shopName}}. Enjoy",
    },
    memorial_day: {
        subject: "{{firstName}}, honor and remember with {{shopName}}",
        color: "#1565c0",
        heading: "Memorial Day",
        message: "Pay tribute to those who served with meaningful arrangements from {{shopName}}. Enjoy",
    },
    international_mens_day: {
        subject: "{{firstName}}, celebrate the men in your life",
        color: "#0277bd",
        heading: "Happy International Men's Day!",
        message: "Show appreciation for the men who matter with a unique arrangement from {{shopName}}. Enjoy",
    },
};

// Generate HTML email body from template + coupon
function generateEmailBody(
    templateKey: string,
    discount: number,
    couponCode: string
): string {
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    if (!template) return "";

    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: ${template.color}; text-align: center;">${template.heading}</h1>
  <p style="font-size: 16px; color: #333; text-align: center;">${template.message} <strong>${discount}% off</strong> your next purchase.</p>
  <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Show this code at our location:</p>
    <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${template.color}; letter-spacing: 2px;">${couponCode}</p>
  </div>
  <p style="color: #666; font-size: 14px; text-align: center;">With love,<br>{{shopName}}</p>
</div>`;
}

interface ActionConfigurationProps {
    coupons: Coupon[];
}

export function ActionConfiguration({ coupons }: ActionConfigurationProps) {
    const form = useFormContext<AutomationFormData>();
    const messageTemplate = form.watch('messageTemplate');
    const couponId = form.watch('couponId');

    // Get selected coupon details
    const selectedCoupon = coupons.find(c => c.id === couponId);

    // Auto-generate email body when template or coupon changes
    useEffect(() => {
        if (messageTemplate && selectedCoupon) {
            const body = generateEmailBody(
                messageTemplate,
                selectedCoupon.discount,
                selectedCoupon.codeName
            );
            form.setValue('emailBody', body, { shouldDirty: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageTemplate, selectedCoupon]);

    // Handle template selection
    const handleTemplateChange = (value: string) => {
        const template = TEMPLATES[value as keyof typeof TEMPLATES];
        if (template) {
            form.setValue('messageTemplate', value);
            form.setValue('emailSubject', template.subject);
        }
    };

    // Handle coupon selection
    const handleCouponChange = (value: string) => {
        form.setValue('couponId', value);
    };

    return (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-5">
            <h3 className="text-sm font-semibold flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                What email should we send?
            </h3>

            {/* Email Template - single row */}
            <FormField
                control={form.control}
                name="messageTemplate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Template</FormLabel>
                        <Select value={field.value} onValueChange={handleTemplateChange}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a template" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {/* Customer templates */}
                                <SelectItem value="birthday">Birthday Special</SelectItem>
                                <SelectItem value="welcome">Welcome Email</SelectItem>
                                <SelectItem value="winback">Win-back</SelectItem>
                                <SelectItem value="anniversary">Anniversary</SelectItem>
                                {/* Holiday templates */}
                                <SelectItem value="valentines_day">Valentine&apos;s Day</SelectItem>
                                <SelectItem value="mothers_day">Mother&apos;s Day</SelectItem>
                                <SelectItem value="christmas">Christmas</SelectItem>
                                <SelectItem value="thanksgiving">Thanksgiving</SelectItem>
                                <SelectItem value="easter">Easter</SelectItem>
                                <SelectItem value="admin_professionals_day">Admin Professionals Day</SelectItem>
                                <SelectItem value="international_womens_day">International Women&apos;s Day</SelectItem>
                                <SelectItem value="memorial_day">Memorial Day</SelectItem>
                                <SelectItem value="international_mens_day">International Men&apos;s Day</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Email Customization - Show when template is chosen */}
            {messageTemplate && (
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Customize Your Email
                    </h4>

                    {/* Email Subject */}
                    <FormField
                        control={form.control}
                        name="emailSubject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject Line</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    Use {"{{firstName}}"} or {"{{shopName}}"} for personalization
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Coupon Selection */}
                    <FormField
                        control={form.control}
                        name="couponId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1">
                                    <Ticket className="w-3 h-3" /> Select Coupon
                                </FormLabel>
                                <Select value={field.value} onValueChange={handleCouponChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a coupon" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {coupons.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                No coupons available
                                            </div>
                                        ) : (
                                            coupons.map((coupon) => (
                                                <SelectItem key={coupon.id} value={coupon.id}>
                                                    <span className="font-mono font-medium">{coupon.codeName}</span>
                                                    <span className="text-muted-foreground ml-2">({coupon.discount}% off)</span>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Customer shows this code in-store</span>
                                    <Link href="/coupons" className="flex items-center gap-1 text-primary hover:underline">
                                        <ExternalLink className="w-3 h-3" /> Manage Coupons
                                    </Link>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Show selected coupon details */}
                    {selectedCoupon && (
                        <div className="bg-muted/50 rounded-md p-3 text-sm">
                            <p><strong>Code:</strong> <span className="font-mono">{selectedCoupon.codeName}</span></p>
                            <p><strong>Discount:</strong> {selectedCoupon.discount}% off</p>
                            <p><strong>Valid until:</strong> {new Date(selectedCoupon.validUntil).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}