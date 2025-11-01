"use client";

import React, { useState } from 'react';
import HeaderSection from './HeaderSection';
import CampaignsTable from './CampaignsTable';
import CreateCampaignModal from './CreateCampaignModal';
import { useRouter } from 'next/navigation';

interface Audience {
  id: string;
  name: string;
  count: number;
}

interface Campaign {
  id: string;
  campaignName: string;
  audienceType: string;
  status: "Draft" | "Scheduled" | "Sent" | "Failed";
  sentAt: string | null;
  createdAt: string;
  recipients: Array<{
    id: string;
    status: string;
    customerId: string;
  }>;
}

interface BroadcastsClientProps {
  campaigns: Campaign[];
  audiences: Audience[];
}

export default function BroadcastsClient({ campaigns, audiences }: BroadcastsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCampaignCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <HeaderSection onNewCampaign={() => setIsModalOpen(true)} />
        <CampaignsTable campaigns={campaigns} />
        
        <CreateCampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          audiences={audiences}
          onCampaignCreated={handleCampaignCreated}
        />
      </div>
    </div>
  );
}