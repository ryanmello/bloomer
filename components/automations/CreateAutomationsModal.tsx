"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateAutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateAutomationModal({ isOpen, onClose }: CreateAutomationModalProps) {
    // TODO eventually
    const handleSave = () => {
        console.log("Saving new automation...");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Automation</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Empty form - will be populated later */}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Create Automation</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}