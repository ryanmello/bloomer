"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type CampaignStatus = "Draft" | "Scheduled" | "Sent" | "Failed";

type Campaign = {
  id: string;
  campaignName: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
};

type AudienceCampaignsResponse = {
  audience: {
    id: string;
    name: string;
  };
  campaigns: Campaign[];
};

function getStatusVariant(status: CampaignStatus) {
  switch (status) {
    case "Sent":
      return "success";
    case "Scheduled":
      return "warning";
    case "Draft":
      return "outline";
    default:
      return "danger";
  }
}

export default function AudienceCampaignsPage({
  params,
}: {
  params: Promise<{ audienceId: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audienceName, setAudienceName] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const { audienceId } = await params;
        const res = await fetch(`/api/audience/${audienceId}/campaigns`);
        const data = (await res.json()) as AudienceCampaignsResponse | { message?: string };

        if (!res.ok) {
          toast.error((data as { message?: string }).message || "Failed to load campaign details");
          router.push("/audiences");
          return;
        }

        const payload = data as AudienceCampaignsResponse;
        setAudienceName(payload.audience.name);
        setCampaigns(payload.campaigns);
      } catch (error) {
        console.error("Failed loading audience campaign details:", error);
        toast.error("Failed to load campaign details");
        router.push("/audiences");
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [params, router]);

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">Audience Campaign Details</CardTitle>
            <CardDescription className="mt-1">
              Campaigns using audience: {audienceName || "Loading..."}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push("/audiences")} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audiences
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Linked Campaigns</CardTitle>
          <CardDescription>
            Includes campaign name, status, and latest updated date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No campaigns use this audience</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{campaign.campaignName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(campaign.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(campaign.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
