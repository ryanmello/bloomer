"use client";

import {use, useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import AudienceCard from "@/components/audiences/AudienceCard";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {ArrowLeft, Trash2, Save} from "lucide-react";
import {toast} from "sonner";

type AudienceData = {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  campaignsSent: number;
  growthRate: number;
  lastCampaign: string;
  status: "active" | "inactive" | "draft";
  engagementRate: number;
  type: "custom" | "predefined";
};

export default function AudienceEditPage({
  params,
}: {
  params: Promise<{audienceId: string}>;
}) {
  const router = useRouter();
  const {audienceId} = use(params);
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);

  /*
  // Mock data - in a real app, fetch this from your API
  const mockAudiences: Record<string, AudienceData> = {
    "new-customers": {
      id: "new-customers",
      name: "New Customers",
      description: "Customers who made their first purchase in the last 30 days",
      customerCount: 287,
      campaignsSent: 8,
      growthRate: 24.5,
      lastCampaign: "2 days ago",
      status: "active",
      engagementRate: 68.3,
      type: "predefined",
    },
    "high-spenders": {
      id: "high-spenders",
      name: "High Spenders",
      description: "Top 20% of customers by lifetime value and purchase frequency",
      customerCount: 156,
      campaignsSent: 15,
      growthRate: 12.8,
      lastCampaign: "5 days ago",
      status: "active",
      engagementRate: 82.4,
      type: "predefined",
    },
    "inactive-customers": {
      id: "inactive-customers",
      name: "Inactive Customers",
      description: "Haven't made a purchase in the last 90 days - win them back!",
      customerCount: 423,
      campaignsSent: 6,
      growthRate: -8.2,
      lastCampaign: "1 week ago",
      status: "inactive",
      engagementRate: 34.2,
      type: "custom",
    },
    "birthday-club": {
      id: "birthday-club",
      name: "Birthday Club",
      description: "Customers with birthdays in the next 30 days for special offers",
      customerCount: 94,
      campaignsSent: 3,
      growthRate: 5.6,
      lastCampaign: "3 days ago",
      status: "active",
      engagementRate: 91.5,
      type: "custom",
    },
  };

  useEffect(() => {
    const data = mockAudiences[audienceId];
    if (data) {
      setAudienceData(data);
    } else {
      toast.error("Audience not found");
      router.push("/audiences");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mockAudiences is static lookup data
  }, [audienceId, router]);
  */

  const handleSave = () => {
    // In a real app, save to your API
    toast.success("Audience updated successfully!");
  };

  const handleDelete = () => {
    // In a real app, delete from your API
    toast.success("Audience deleted successfully!");
    router.push("/audiences");
  };

  if (!audienceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/audiences")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Edit Audience
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update audience settings and preview changes in real-time
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Audience?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    &quot;{audienceData.name}&quot;
                  </span>
                  ? This action cannot be undone and all associated campaigns
                  will be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90">
                  Delete Audience
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Preview Card */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Preview</h2>
            <p className="text-sm text-muted-foreground">
              See how your audience card will appear
            </p>
          </div>
          <div className="sticky top-6">
            <AudienceCard {...audienceData} />
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Audience Details
            </h2>
            <div className="rounded-2xl border shadow-sm p-6 bg-card border-border space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Audience Name</Label>
                <Input
                  id="name"
                  value={audienceData.name}
                  onChange={(e) =>
                    setAudienceData({...audienceData, name: e.target.value})
                  }
                  placeholder="Enter audience name"
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={audienceData.description}
                  onChange={(e) =>
                    setAudienceData({
                      ...audienceData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe your audience"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={audienceData.status}
                    onValueChange={(value: "active" | "inactive" | "draft") =>
                      setAudienceData({...audienceData, status: value})
                    }>
                    <SelectTrigger id="status" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={audienceData.type}
                    onValueChange={(value: "custom" | "predefined") =>
                      setAudienceData({...audienceData, type: value})
                    }>
                    <SelectTrigger id="type" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="predefined">Predefined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Statistics
            </h2>
            <div className="rounded-2xl border shadow-sm p-6 bg-card border-border space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Customer Count */}
                <div className="space-y-2">
                  <Label htmlFor="customerCount">Customer Count</Label>
                  <Input
                    id="customerCount"
                    type="number"
                    value={audienceData.customerCount}
                    onChange={(e) =>
                      setAudienceData({
                        ...audienceData,
                        customerCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11"
                  />
                </div>

                {/* Campaigns Sent */}
                <div className="space-y-2">
                  <Label htmlFor="campaignsSent">Campaigns Sent</Label>
                  <Input
                    id="campaignsSent"
                    type="number"
                    value={audienceData.campaignsSent}
                    onChange={(e) =>
                      setAudienceData({
                        ...audienceData,
                        campaignsSent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-11"
                  />
                </div>

                {/* Growth Rate */}
                <div className="space-y-2">
                  <Label htmlFor="growthRate">Growth Rate (%)</Label>
                  <Input
                    id="growthRate"
                    type="number"
                    step="0.1"
                    value={audienceData.growthRate}
                    onChange={(e) =>
                      setAudienceData({
                        ...audienceData,
                        growthRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-11"
                  />
                </div>

                {/* Engagement Rate */}
                <div className="space-y-2">
                  <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
                  <Input
                    id="engagementRate"
                    type="number"
                    step="0.1"
                    value={audienceData.engagementRate}
                    onChange={(e) =>
                      setAudienceData({
                        ...audienceData,
                        engagementRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-11"
                  />
                </div>
              </div>

              {/* Last Campaign */}
              <div className="space-y-2">
                <Label htmlFor="lastCampaign">Last Campaign</Label>
                <Input
                  id="lastCampaign"
                  value={audienceData.lastCampaign}
                  onChange={(e) =>
                    setAudienceData({
                      ...audienceData,
                      lastCampaign: e.target.value,
                    })
                  }
                  placeholder="e.g., 2 days ago"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
