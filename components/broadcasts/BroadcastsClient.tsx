"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeaderSection from './HeaderSection';
import CampaignsTable from './CampaignsTable';
import CreateCampaignModal from './CreateCampaignModal';
import { useRouter, useSearchParams } from 'next/navigation';

interface Campaign {
  id: string;
  campaignName: string;
  status: "Failed" | "Draft" | "Scheduled" | "Sent";
  sentAt: string | null;
  createdAt: string;
  audience: {
    id: string;
    name: string;
  } | null;
  recipients: { id: string; status: string; customerId: string }[];
}

interface Audience {
  id: string;
  name: string;
  count: number;
}

interface BroadcastsClientProps {
  campaigns: Campaign[];
  audiences: Audience[];
}

function transformCampaign(campaign: any): Campaign {
  return {
    id: campaign.id,
    campaignName: campaign.campaignName,
    status: campaign.status,
    sentAt: campaign.sentAt ? new Date(campaign.sentAt).toISOString() : null,
    createdAt: new Date(campaign.createdAt).toISOString(),
    audience: campaign.audience ? { id: campaign.audience.id, name: campaign.audience.name } : null,
    recipients: (campaign.recipients || []).map((r: { id: string; status: string; customerId: string }) => ({
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

  const [prefillName, setPrefillName] = useState<string | undefined>(undefined);
  const [prefillBody, setPrefillBody] = useState<string | undefined>(undefined);
  const [prefillAudience, setPrefillAudience] = useState<string[] | undefined>(undefined);

  const searchParams = useSearchParams();


  useEffect(() => {
  const queryName = searchParams.get('prefillName');
  const queryBody = searchParams.get('prefillBody');
  const queryAudience = searchParams.get('prefillAudience');

  if (queryName || queryBody || queryAudience) {
    const decodedName = queryName ? decodeURIComponent(queryName) : undefined;
    const decodedBody = queryBody ? decodeURIComponent(queryBody) : undefined;
    const decodedAudience = queryAudience ? decodeURIComponent(queryAudience).split(',') : undefined;

    setPrefillName(decodedName);
    setPrefillBody(decodedBody);
    setPrefillAudience(decodedAudience);
    setIsModalOpen(true);

    router.replace('/broadcasts');
  }
  }, [searchParams, router]);

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
    // Small delay so DB write is committed before we fetch

    setPrefillName(undefined);
    setPrefillBody(undefined);

    await new Promise(resolve => setTimeout(resolve, 300));
    await refreshCampaigns();
  }, [refreshCampaigns]);

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
      c => c.status === 'Sent' && c.recipients.some((r: { status: string }) => r.status === 'Pending')
    );
    if (!hasSendingCampaigns) return;

    const interval = setInterval(refreshCampaigns, 5000);
    return () => clearInterval(interval);
  }, [campaigns, refreshCampaigns]);

  const openCampaignWithPrefill = (name?: string, body?: string) => {
    setPrefillName(name);
    setPrefillBody(body);
    setIsModalOpen(true);
  };

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <HeaderSection onNewCampaign={() => setIsModalOpen(true)} />
      <CampaignsTable
        campaigns={campaigns}
        onCampaignDeleted={refreshCampaigns}
      />

      <CreateCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        audiences={audiences}
        onCampaignCreated={handleCampaignCreated}
        prefillName={prefillName}  
        prefillBody={prefillBody}
        prefillAudience={prefillAudience}
      />
    </main>
  );
}