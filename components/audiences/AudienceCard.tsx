"use client";

import {
  Users,
  Send,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mail,
  Sparkles,
  Edit,
  Pencil,
} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

type AudienceCardProps = {
  id?: string;
  name: string;
  description: string;

  status: "active" | "inactive" | "draft";
  type?: "custom" | "predefined";

  // change these optional since database do not store metrics
  customerCount?: number;
  campaignsSent?: number;
  growthRate?: number;
  lastCampaign?: string;
  engagementRate?: number;
};

export default function AudienceCard({
  id,
  name,
  description,
  status,

  customerCount,
  campaignsSent,
  growthRate,
  lastCampaign,
  engagementRate,
}: AudienceCardProps) {
  const router = useRouter();
  // set audience props. If customerCount is null or undefined, use 0 instead.
  const setCustomerCount = customerCount ?? 0;
  const setCampaignsSent = campaignsSent ?? 0;
  const setGrowthRate = growthRate ?? 0;
  const isPositiveGrowth = setGrowthRate >= 0;

  const handleEdit = () => {
    if (id) {
      router.push(`/audiences/${id}`);
    }
  };

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

  // Get gradient colors based on status
  const getGradientColors = () => {
    switch (status) {
      case "active":
        return "from-emerald-500/10 via-cyan-500/10 to-blue-500/10 dark:from-emerald-500/5 dark:via-cyan-500/5 dark:to-blue-500/5";
      case "inactive":
        return "from-slate-500/10 via-gray-500/10 to-zinc-500/10 dark:from-slate-500/5 dark:via-gray-500/5 dark:to-zinc-500/5";
      case "draft":
        return "from-amber-500/10 via-orange-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:via-orange-500/5 dark:to-yellow-500/5";
    }
  };

  // Get accent color for the top border
  const getAccentBorder = () => {
    switch (status) {
      case "active":
        return "border-t-emerald-500 dark:border-t-emerald-400";
      case "inactive":
        return "border-t-gray-500 dark:border-t-gray-400";
      case "draft":
        return "border-t-amber-500 dark:border-t-amber-400";
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border border-t-4 shadow-sm p-6 bg-gradient-to-br ${getGradientColors()} ${getAccentBorder()} bg-card hover:shadow-xl transition-all duration-300 min-w-0 overflow-hidden`}>
      {/* Decorative gradient orb */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl transition-transform duration-500" />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-bold text-foreground truncate">
              {name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        </div>
        <Badge
          className={`ml-2 capitalize ring-1 ring-inset ${getStatusColor()} shadow-sm`}>
          {status}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-2 gap-4 mb-4">
        {/* Customer Count */}
        <div className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <p className="text-xs font-medium">Customers</p>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text">
            {setCustomerCount.toLocaleString()}
          </p>
        </div>

        {/* Campaigns Sent */}
        <div className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-center gap-1.5">
            <Send className="h-4 w-4" />
            <p className="text-xs font-medium">Campaigns</p>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text">
            {setCampaignsSent}
          </p>
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
            <span
              className={`text-sm font-medium ${
                isPositiveGrowth
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}>
              {isPositiveGrowth ? "+" : ""}
              {growthRate}%
            </span>
          </div>
        </div>

        {/* Engagement Rate */}
        {engagementRate !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Engagement</span>
            <span className="text-sm font-medium text-foreground">
              {engagementRate}%
            </span>
          </div>
        )}

        {/* Last Campaign */}
        {lastCampaign && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-sm">Last Campaign</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {lastCampaign}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="relative mt-4 pt-4 border-t border-border flex gap-2">
        <Button className="flex-1 shadow-md hover:shadow-lg transition-all duration-200">
          View Details
        </Button>
        <Button
          onClick={handleEdit}
          variant="outline"
          size="icon"
          className="shadow-sm hover:shadow-md transition-all duration-200">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="shadow-sm hover:shadow-md transition-all duration-200">
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
