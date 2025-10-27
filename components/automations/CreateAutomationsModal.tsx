"use client";

import { useState } from 'react'; // <-- Import useState
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    // DialogFooter removed, we'll use ModalFooter now
} from "@/components/ui/dialog";
// Button is used inside ModalFooter, not directly here anymore

// Import the new components
import { FormFields } from "./FormFields";

interface CreateAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Define the shape of the form data
export interface AutomationFormData {
    automationName: string;
    description: string;
    category: string;
    triggerType: string;
    timing: string;
    additionalConditions: string;
    actionType: string;
    messageTemplate: string;
    sendTo: string;
    activateImmediately: boolean;
    trackEmailClicks: boolean;
}

// Define the initial state
const initialState: AutomationFormData = {
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
};


export function CreateAutomationModal({ isOpen, onClose }: CreateAutomationModalProps) {
    // Add state to manage the form data
    const [formData, setFormData] = useState<AutomationFormData>(initialState);

    // This function will eventually call the API
    const handleSave = () => {
        console.log("Saving new automation:", JSON.stringify(formData, null, 2));
        onClose();
        setFormData(initialState); // Reset form on save/close
    };

    // Make sure to reset form data when closing via X or Cancel
    const handleClose = () => {
        onClose();
        setFormData(initialState);
    };

    return (
        // Use handleClose for onOpenChange to reset state
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* FormFields: UN-62, UN-63, UN-64, UN-67 */}
                    <FormFields data={formData} setData={setFormData} />
                </div>
            </DialogContent>
        </Dialog>
    );
}