import { Users, Send, TrendingUp, TrendingDown, Calendar, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AudienceCardProps = {
  name: string;
  description: string;
  customerCount: number;
  campaignsSent: number;
  growthRate: number;
  lastCampaign?: string;
  status: "active" | "inactive" | "draft";
  engagementRate?: number;
};

export default function AudienceCard({
  name,
  description,
  customerCount,
  campaignsSent,
  growthRate,
  lastCampaign,
  status,
  engagementRate,
}: AudienceCardProps) {
  const isPositiveGrowth = growthRate >= 0;

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700";
      case "inactive":
        return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700";
      case "draft":
        return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700";
    }
  };

  return (
    <div className="rounded-2xl border shadow-sm p-6 bg-card border-border hover:shadow-md transition-all duration-200 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
        </div>
        <Badge className={`ml-2 capitalize ring-1 ring-inset ${getStatusColor()}`}>
          {status}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Customer Count */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium">Customers</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{customerCount.toLocaleString()}</p>
        </div>

        {/* Campaigns Sent */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Send className="h-4 w-4" />
            <p className="text-xs font-medium">Campaigns</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{campaignsSent}</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3 pt-3 border-t border-border">
        {/* Growth Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Growth Rate</span>
          <div className="flex items-center gap-1.5">
            {isPositiveGrowth ? (
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
            <span className={`text-sm font-medium ${isPositiveGrowth ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositiveGrowth ? '+' : ''}{growthRate}%
            </span>
          </div>
        </div>

        {/* Engagement Rate */}
        {engagementRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement</span>
            <span className="text-sm font-medium text-foreground">{engagementRate}%</span>
          </div>
        )}

        {/* Last Campaign */}
        {lastCampaign && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-sm">Last Campaign</span>
            </div>
            <span className="text-sm font-medium text-foreground">{lastCampaign}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-border flex gap-2">
        <button className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          View Details
        </button>
        <button className="px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors">
          <Mail className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

