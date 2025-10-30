'use client';
import React, { useState } from 'react';
import { Send, Mail, Users, Calendar, MoreVertical, Plus, Search } from 'lucide-react';

export default function EmailBroadcastsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700';
      case 'Draft':
        return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.audience.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Email Broadcasts</h1>
            <p className="text-muted-foreground mt-1">Create and manage email campaigns</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Email Campaign
          </button>
        </div>

        {/* Campaigns Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Table Header with Search */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                    Campaign name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                    Audience
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                    Sent
                  </th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-foreground">
                        {campaign.campaignName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">
                        {campaign.audience}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">
                        {campaign.sent}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No campaigns found
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">New Email Campaign</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and send an email to your customers
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Campaign name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Campaign name"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
                />
              </div>

              {/* Select Audience */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Select audience
                </label>
                <select
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition appearance-none cursor-pointer"
                >
                  <option value="">Campaign name</option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name} ({audience.count.toLocaleString()} customers)
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Subject line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email body"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition"
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your email message here..."
                  rows={12}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-between">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors"
              >
                Save Draft
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSend}
                  className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
                <button className="px-6 py-2.5 border border-border rounded-lg font-semibold hover:bg-muted transition-colors">
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}