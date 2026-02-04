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
  status: "active" | "inactive" | "draft";
  type: "custom" | "predefined";
  customerCount: number;
  campaignsSent: number;
  growthRate: number;
  lastCampaign: string;
  engagementRate: number;
};

type Props = {
  mode: "create" | "edit";
  initialData: AudienceData;
};

export default function AudienceForm({mode, initialData}: Props) {
  const router = useRouter();
  const [audienceData, setAudienceData] = useState<AudienceData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // In a real app, save to your
    setIsLoading(true);

    if (!audienceData.name.trim()) {
      toast.error("Please enter an audience name");
      return;
    }

    try {
      const url =
        mode === "create"
          ? "/api/audience"
          : `/api/audience/${audienceData.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: audienceData.name.trim(),
          description: audienceData.description || null,
          status: audienceData.status,
          type: audienceData.type,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      if (res.ok) {
        toast.success("Audience created successfully!");
      } else {
        toast.error("Failed to create Audience");
      }

      router.push("/audiences");
      router.refresh();
    } catch (error) {
      console.error("Error creating Audience:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    // In a real app, delete from your API
    toast.success("Audience deleted successfully!");
    router.push("/audiences");
  };

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
        </div>
      </div>
    </main>
  );
}
