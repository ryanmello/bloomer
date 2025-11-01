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
import { Plus } from 'lucide-react';
import { AutomationSettings } from './AutomationSettings';

interface CreateAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Define the Zod schema for validation
const automationFormSchema = z.object({
    automationName: z.string().min(1, "Automation name is required"),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    triggerType: z.string().min(1, "Trigger type is required"),
    timing: z.string().min(1, "Timing is required"),
    additionalConditions: z.string().optional(),
    actionType: z.string().min(1, "Action type is required"),
    messageTemplate: z.string().min(1, "Message template is required"),
    sendTo: z.string().min(1, "Recipient is required"),
    activateImmediately: z.boolean(),
    trackEmailClicks: z.boolean(),
});

// Export the type inferred from the schema
export type AutomationFormData = z.infer<typeof automationFormSchema>;

export function CreateAutomationModal({ isOpen, onClose }: CreateAutomationModalProps) {
    // Initialize React Hook Form with Zod validation
    const form = useForm<AutomationFormData>({
        resolver: zodResolver(automationFormSchema),
        defaultValues: {
            automationName: "",
            description: "",
            category: "",
            triggerType: "",
            timing: "",
            additionalConditions: "",
            actionType: "",
            messageTemplate: "",
            sendTo: "",
            activateImmediately: false,
            trackEmailClicks: true,
        },
    });

    // Watch the form values for the preview
    const formData = form.watch();

    // This function will be called when form is submitted
    const onSubmit = (data: AutomationFormData) => {
        console.log(data);
        onClose();
        form.reset(); // Reset form on save/close
    };

    // Make sure to reset form data when closing via X or Cancel
    const handleClose = () => {
        onClose();
        form.reset();
    };

    return (
        // Use handleClose for onOpenChange to reset state
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-8 py-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                            <FormFields />
                            
                            <div className="space-y-6">
                                <TriggerConfiguration />
                                <ActionConfiguration />
                                
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-fit"
                                    onClick={() => console.log("TODO: Add another action")}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Another Action
                                </Button>
                            </div>

                            <PreviewDisplay data={formData} />
                            
                            <AutomationSettings />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create Automation
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}