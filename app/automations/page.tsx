"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateAutomationModal } from '@/components/automations/CreateAutomationsModal';
import { Plus } from 'lucide-react';

export default function AutomationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create automated workflows for customer communication and follow-ups
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white hover:bg-gray-800">
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      <CreateAutomationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}