"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { TriggerConfiguration } from "./TriggerConfigurations";
import { FormFields } from "./FormFields";
import { ActionConfiguration } from "./ActionConfiguration";
import { Button } from '@/components/ui/button';
import { PreviewDisplay } from './PreviewDisplay';
import { AutomationSettings } from './AutomationSettings';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Coupon } from '@/types/coupon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Users } from 'lucide-react';

type Audience = {
    id: string;
    name: string;
    description?: string | null;
};

interface CreateAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

// Define the Zod schema for validation
const automationFormSchema = z.object({
    automationName: z.string().min(1, "Give your automation a name"),
    category: z.string().optional(), // Auto-set from trigger
    triggerType: z.string().min(1, "Select a trigger event"),
    timing: z.string().min(1, "Select when to send"),
    audienceId: z.string().optional(), // Optional audience filter
    messageTemplate: z.string().min(1, "Select an email template"),
    emailSubject: z.string().optional(),
    couponId: z.string().optional(),
    emailBody: z.string().optional(),
    activateImmediately: z.boolean(),
});

// Export the type inferred from the schema
export type AutomationFormData = z.infer<typeof automationFormSchema>;

export function CreateAutomationModal({ isOpen, onClose, onSuccess }: CreateAutomationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shopName, setShopName] = useState<string>('Your Shop');
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [audiences, setAudiences] = useState<Audience[]>([]);

    // Fetch shop name and coupons when modal opens
    useEffect(() => {
        async function fetchData() {
            try {
                // Get active shop ID and name
                const activeRes = await fetch('/api/shop/active');
                if (activeRes.ok) {
                    const { activeShopId } = await activeRes.json();
                    if (activeShopId) {
                        const shopsRes = await fetch('/api/shop');
                        if (shopsRes.ok) {
                            const shops = await shopsRes.json();
                            const activeShop = shops.find((s: { id: string }) => s.id === activeShopId);
                            if (activeShop) {
                                setShopName(activeShop.name);
                            }
                        }
                    }
                }

                // Fetch coupons
                const couponsRes = await fetch('/api/coupon');
                if (couponsRes.ok) {
                    const couponsData = await couponsRes.json();
                    setCoupons(couponsData);
                }

                // Fetch audiences
                const audiencesRes = await fetch('/api/audience');
                if (audiencesRes.ok) {
                    const audiencesData = await audiencesRes.json();
                    setAudiences(audiencesData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Initialize React Hook Form with Zod validation
    const form = useForm<AutomationFormData>({
        resolver: zodResolver(automationFormSchema),
        defaultValues: {
            automationName: "",
            category: "",
            triggerType: "",
            timing: "",
            audienceId: "",
            messageTemplate: "",
            emailSubject: "",
            couponId: "",
            emailBody: "",
            activateImmediately: true,
        },
    });

    // Watch the form values for the preview
    const formData = form.watch();

    // Get selected coupon for preview
    const selectedCoupon = coupons.find(c => c.id === formData.couponId) || null;

    // This function will be called when form is submitted
    const onSubmit = async (data: AutomationFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.automationName,
                    category: data.category || 'lifecycle',
                    triggerType: data.triggerType,
                    timing: parseInt(data.timing) || 0,
                    actionType: 'send_email',
                    messageTemplate: data.messageTemplate || null,
                    emailSubject: data.emailSubject || null,
                    emailBody: data.emailBody || null,
                    couponId: data.couponId || null,
                    audienceId: data.audienceId || null,
                    status: data.activateImmediately ? 'active' : 'paused',
                }),
            });

            if (response.ok) {
                toast.success('Automation created successfully');
                onClose();
                form.reset();
                onSuccess?.();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to create automation');
            }
        } catch (error) {
            console.error('Error creating automation:', error);
            toast.error('Failed to create automation');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Make sure to reset form data when closing via X or Cancel
    const handleClose = () => {
        onClose();
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create Automation</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6 py-4 max-h-[65vh] overflow-y-auto pr-2">
                            <FormFields />
                            <TriggerConfiguration />

                            {/* Audience Selection */}
                            <FormField
                                control={form.control}
                                name="audienceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Target Audience
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(value === "all" ? "" : value)}
                                            value={field.value || "all"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Customers (no filter)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">All Customers</SelectItem>
                                                {audiences.map((audience) => (
                                                    <SelectItem key={audience.id} value={audience.id}>
                                                        {audience.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Select an audience to target specific customers, or leave as &quot;All Customers&quot; to include everyone.
                                        </p>
                                    </FormItem>
                                )}
                            />

                            <ActionConfiguration coupons={coupons} />
                            <PreviewDisplay data={formData} shopName={shopName} coupon={selectedCoupon ?? undefined} />
                            <AutomationSettings />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Automation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}