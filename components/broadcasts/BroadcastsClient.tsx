"use client";

import React, { useState, useEffect, useRef } from 'react';
import HeaderSection from './HeaderSection';
import CampaignsTable from './CampaignsTable';
import CreateCampaignModal from './CreateCampaignModal';
import { useRouter } from 'next/navigation';

interface CampaignRow {
  id: string;
  campaignName: string;
  status: "Failed" | "Draft" | "Scheduled" | "Sent";
  sentAt: string | null;
  createdAt: string;
  audience: {
    id: string;
    name: string;
  } | null;
}

interface Audience {
  id: string;
  name: string;
  count: number;
}

interface BroadcastsClientProps {
  campaigns: CampaignRow[];
  audiences: Audience[];
}

export default function BroadcastsClient({ campaigns, audiences }: BroadcastsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCampaignCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  // Set up polling for scheduled campaigns
  useEffect(() => {
    // Check for scheduled campaigns and trigger sending
    const checkAndSendScheduledCampaigns = async () => {
      try {
        // Check if there are any scheduled campaigns
        const hasScheduledCampaigns = campaigns.some(
          campaign => campaign.status === 'Scheduled'
        );

        if (!hasScheduledCampaigns) {
          return; // No scheduled campaigns, skip the API call
        }

        // Call the send-schedule endpoint to process any due campaigns
        const response = await fetch('/api/campaigns/send-schedule', {
          method: 'GET',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.processed > 0) {
            // Campaigns were sent, refresh the page to update the UI
            router.refresh();
          }
        }
      } catch (error) {
        // Silently fail - don't spam console with errors
        console.debug('Error checking scheduled campaigns:', error);
      }
    };

    // Check immediately on mount
    checkAndSendScheduledCampaigns();

    // Then check every 30 seconds for scheduled campaigns
    // This ensures campaigns are sent within 30 seconds of their scheduled time
    pollingIntervalRef.current = setInterval(() => {
      checkAndSendScheduledCampaigns();
    }, 30000); // 30 seconds - more responsive for same-day scheduling

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [campaigns, router]);

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <HeaderSection onNewCampaign={() => setIsModalOpen(true)} />
      <CampaignsTable campaigns={campaigns} />

      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        audiences={audiences}
        onCampaignCreated={handleCampaignCreated}
      />
    </main>
  );
}