'use client';
import { useState } from 'react';
import { Mail, Search, MoreVertical } from 'lucide-react';

interface Campaign {
  id: string;
  campaignName: string;
  audience: string;
  status: string;
  sent: string;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
}

export default function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

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
  );
}