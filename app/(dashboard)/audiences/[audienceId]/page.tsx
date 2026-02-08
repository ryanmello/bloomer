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
import AudienceForm from "@/components/audiences/AudienceForm";

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
  status: "active" | "inactive" | "draft";
  type: "custom" | "predefined";

  // not in audience db
  customerCount: number;
  campaignsSent: number;
  growthRate: number;
  lastCampaign: string;
  engagementRate: number;
  field?: string;
};

export default function AudienceEditPage({
  params,
}: {
  params: Promise<{audienceId: string}>;
}) {
  const router = useRouter();
  const [audienceData, setAudienceData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(true);

  // get audiences from database
  const fetchAudiencesData = async () => {
    try {
      setLoading(true);
      const {audienceId} = await params;
      const res = await fetch(`/api/audience/${audienceId}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error("Audience not found");
        router.push("/audiences");
        return;
      }

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
    } catch (error) {
      console.error("Audiences data load failed", error);
      toast.error("Failed to load audience");
      router.push("/audiences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiencesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

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

  return <AudienceForm mode="edit" initialData={audienceData} />;
}
