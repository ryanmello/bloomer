'use client';
import { Plus } from 'lucide-react';

interface HeaderSectionProps {
  onNewCampaign: () => void;
}

export default function HeaderSection({ onNewCampaign }: HeaderSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Email Broadcasts</h1>
        <p className="text-muted-foreground mt-1">Create and manage email campaigns</p>
      </div>
      <button
        onClick={onNewCampaign}
        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
      >
        <Plus className="w-5 h-5" />
        New Email Campaign
      </button>
    </div>
  );
}