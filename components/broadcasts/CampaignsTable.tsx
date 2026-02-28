'use client';
import { Mail, Search, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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

interface CampaignsTableProps {
  campaigns: CampaignRow[];
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
      case 'Failed':
        return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '\u2014';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.audience?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle>Campaigns</CardTitle>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-muted text-muted-foreground ring-border">
                  {campaigns.length}
                </span>
              </div>
              <CardDescription>
                All your email campaigns in one place
              </CardDescription>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Campaign
                </th>
                <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audience
                </th>
                <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-2.5 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-6">
                    <span className="text-sm font-medium">
                      {campaign.campaignName}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-sm text-muted-foreground">
                      {campaign.audience?.name ?? "All Customers"}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(campaign.sentAt || campaign.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 px-6">
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
          <div className="py-12 text-center">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {campaigns.length === 0
                ? 'No campaigns yet. Create your first one!'
                : 'No campaigns match your search.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
