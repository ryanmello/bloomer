"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

function transformCampaign(campaign: any): Campaign {
  return {
    id: campaign.id,
    campaignName: campaign.campaignName,
    audienceType: campaign.audienceType,
    status: campaign.status,
    sentAt: campaign.sentAt ? new Date(campaign.sentAt).toISOString() : null,
    createdAt: new Date(campaign.createdAt).toISOString(),
    recipients: (campaign.recipients || []).map((r: any) => ({
      id: r.id,
      status: r.status,
      customerId: r.customerId
    }))
  };
}

export default function BroadcastsClient({ campaigns: initialCampaigns, audiences }: BroadcastsClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with server when props change (e.g. after router.refresh)
  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  const refreshCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data.map(transformCampaign) : []);
      }
    } catch (e) {
      console.debug('Error refreshing campaigns:', e);
    }
  }, []);

  const handleCampaignCreated = useCallback(async () => {
    setIsModalOpen(false);
    await refreshCampaigns();
    router.refresh();
  }, [refreshCampaigns, router]);

  // Set up polling for scheduled campaigns and in-flight sends
  useEffect(() => {
    const checkAndSendScheduledCampaigns = async () => {
      try {
        const hasScheduledCampaigns = campaigns.some(
          campaign => campaign.status === 'Scheduled'
        );

        if (!hasScheduledCampaigns) {
          return;
        }

        const response = await fetch('/api/campaigns/send-schedule', {
          method: 'GET',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.processed > 0) {
            await refreshCampaigns();
            router.refresh();
          }
        }
      } catch (error) {
        console.debug('Error checking scheduled campaigns:', error);
      }
    };

    checkAndSendScheduledCampaigns();

    pollingIntervalRef.current = setInterval(() => {
      checkAndSendScheduledCampaigns();
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [campaigns, router, refreshCampaigns]);

  // Poll for campaign status updates when emails are being sent (Pending recipients)
  useEffect(() => {
    const hasSendingCampaigns = campaigns.some(
      c => c.status === 'Sent' && c.recipients.some(r => r.status === 'Pending')
    );
    if (!hasSendingCampaigns) return;

    const interval = setInterval(refreshCampaigns, 5000);
    return () => clearInterval(interval);
  }, [campaigns, refreshCampaigns]);

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