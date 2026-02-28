'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderSectionProps {
  onNewCampaign: () => void;
}

export default function HeaderSection({ onNewCampaign }: HeaderSectionProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcasts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage email campaigns
        </p>
      </div>
      <Button onClick={onNewCampaign} className="gap-2">
        <Plus className="h-4 w-4" />
        New Campaign
      </Button>
    </div>
  );
}
