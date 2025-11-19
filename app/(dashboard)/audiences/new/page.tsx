"use client";

import AudienceForm from "@/components/audiences/AudienceForm";

const emptyAudience = {
  id: "",
  name: "",
  description: "",
  customerCount: 0,
  campaignsSent: 0,
  growthRate: 0,
  lastCampaign: "",
  status: "draft",
  engagementRate: 0,
  type: "custom",
} as const;

export default function NewAudiencePage() {
  return <AudienceForm mode="create" initialData={emptyAudience} />;
}
