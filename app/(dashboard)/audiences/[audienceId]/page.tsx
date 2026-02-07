"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AudienceCard from "@/components/audiences/AudienceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const fieldDisplayMap: Record<string, string> = {
  group: "Customer Group",
  email: "Email",
  phoneNumber: "Phone Number",
  location: "Location",
  totalSpent: "Total Spent",
  totalOrders: "Total Orders",
  lastOrderDate: "Last Order Date",
  joinDate: "Join Date",
};

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
  field?: string;
};

export default function AudienceEditPage({
  params
}: {
  params: { audienceId: string }
}) {
  const router = useRouter();
  const { audienceId } = params;
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetches a single audience by ID from the backend and populates the form with its data
  useEffect(() => {
    const fetchAudience = async () => {
      try {
        const res = await fetch(`/api/audience/${audienceId}`);
        if (!res.ok) throw new Error("Audience not found");

        const data = await res.json();

        // Map backend data to the frontend type
        setAudienceData({
          id: data.id,
          name: data.name,
          description: data.description || "",
          status: data.status || "draft",
          type: data.type || "custom",
          field: data.field ?? "",
          customerCount: data.customerCount || 0,
          campaignsSent: data.campaignsSent || 0,
          growthRate: data.growthRate || 0,
          lastCampaign: data.lastCampaign || "",
          engagementRate: data.engagementRate || 0,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load audience");
        router.push("/audiences");
      } finally {
        setLoading(false);
      }
    };

    fetchAudience();
  }, [audienceId, router]);

  const handleSave = () => {
    toast.success("Audience updated successfully!");
    // call your API to save changes here (unfinished)
  };

  const handleDelete = () => {
    toast.success("Audience deleted successfully!");
    // call your API to delete audience here (unfinished)
    router.push("/audiences");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!audienceData) return null;

  return (
    <main className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/audiences")}
          >
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
                  Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{audienceData.name}&quot;</span>? This
                  action cannot be undone and all associated campaigns will be
                  affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
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
                    setAudienceData({ ...audienceData, name: e.target.value })
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
                      setAudienceData({ ...audienceData, status: value })
                    }
                  >
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
                      setAudienceData({ ...audienceData, type: value })
                    }
                  >
                    <SelectTrigger id="type" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="predefined">Predefined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Field */}
                <div className="space-y-2">
                  <Label htmlFor="field">Customer Field</Label>
                  <Input
                    id="field"
                    value={fieldDisplayMap[audienceData.field || ""] || "None"}
                    readOnly
                    className="h-11 bg-gray-100"
                  />
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
                    readOnly
                    className="h-11 bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignsSent">Campaigns Sent</Label>
                  <Input
                    id="campaignsSent"
                    type="number"
                    value={audienceData.campaignsSent}
                    readOnly
                    className="h-11 bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="growthRate">Growth Rate (%)</Label>
                  <Input
                    id="growthRate"
                    type="number"
                    step="0.1"
                    value={audienceData.growthRate}
                    readOnly
                    className="h-11 bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
                  <Input
                    id="engagementRate"
                    type="number"
                    step="0.1"
                    value={audienceData.engagementRate}
                    readOnly
                    className="h-11 bg-gray-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastCampaign">Last Campaign</Label>
                <Input
                  id="lastCampaign"
                  value={audienceData.lastCampaign}
                  readOnly
                  className="h-11 bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
