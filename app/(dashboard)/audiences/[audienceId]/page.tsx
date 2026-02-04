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
      const data: AudienceData = await res.json();

      if (!res.ok) {
        toast.error("Audience not found");
        router.push("/audiences");
        return;
      }
      setAudienceData({
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        type: data.type,
        // metrics defaults
        customerCount: 0,
        campaignsSent: 0,
        growthRate: 0,
        lastCampaign: "",
        engagementRate: 0,
      });
    } catch (error) {
      console.error("Audiences data load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiencesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);
  const handleSave = () => {
    // In a real app, save to your API
    toast.success("Audience updated successfully!");
  };

  const handleDelete = () => {
    // In a real app, delete from your API
    toast.success("Audience deleted successfully!");
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

  return <AudienceForm mode="edit" initialData={audienceData} />;
}
