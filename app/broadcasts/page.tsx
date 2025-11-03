"use client";

import React, { useState } from 'react';
import HeaderSection from '@/components/broadcasts/HeaderSection';
import CampaignsTable from '@/components/broadcasts/CampaignsTable';
import CreateCampaignModal from '@/components/broadcasts/CreateCampaignModal';

export default function EmailBroadcastsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Sample audiences matching your system
  const audiences = [
    { id: 'potential', name: 'Potential Customers', count: 850 },
    { id: 'all', name: 'All Customers', count: 1250 },
    { id: 'vip', name: 'VIP Customers', count: 85 },
    { id: 'new', name: 'New Customers', count: 320 },
    { id: 'newsletter', name: 'Newsletter Subscribers', count: 2100 },
  ];

  // Sample past campaigns
  const campaigns = [
    {
      id: '1',
      campaignName: 'Spring Sale',
      audience: 'Potential Customers',
      status: 'Sent',
      sent: 'Mar 15/24',
    },
    {
      id: '2',
      campaignName: 'Holiday Offer',
      audience: 'All Customers',
      status: 'Scheduled',
      sent: 'Dec 1 2022',
    },
    {
      id: '3',
      campaignName: 'Newsletter #1',
      audience: 'Newsletter Subscribers',
      status: 'Draft',
      sent: '...',
    },
  ];

  const handleSend = () => {
    if (!campaignName || !selectedAudience || !subject || !emailBody) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Sending campaign:', {
      campaignName,
      selectedAudience,
      subject,
      emailBody,
    });

    // Reset and close
    setCampaignName('');
    setSelectedAudience('');
    setSubject('');
    setEmailBody('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <HeaderSection onNewCampaign={() => setIsModalOpen(true)} />
        <CampaignsTable campaigns={campaigns} />
        
        <CreateCampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          campaignName={campaignName}
          setCampaignName={setCampaignName}
          selectedAudience={selectedAudience}
          setSelectedAudience={setSelectedAudience}
          subject={subject}
          setSubject={setSubject}
          emailBody={emailBody}
          setEmailBody={setEmailBody}
          onSend={handleSend}
          audiences={audiences}
        />
      </div>
    </div>
  );
}