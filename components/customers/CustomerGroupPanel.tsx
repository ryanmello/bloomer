"use client";
import { Badge } from "@/components/ui/badge";
import { Star, RefreshCw, User, Users } from "lucide-react";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

interface CustomerGroupPanelProps {
  group?: CustomerGroup;
}

export function CustomerGroupPanel({ group }: CustomerGroupPanelProps) {
  const displayGroup = group ?? "New";

  const getVariant = (group: CustomerGroup) => {
    switch (group) {
      case "VIP":
        return "purple";
      case "Repeat":
        return "success";
      case "New":
        return "info";
      case "Potential":
        return "default";
      default:
        return "info";
    }
  };

  const getIcon = (group: CustomerGroup) => {
    switch (group) {
      case "VIP":
        return <Star className="size-3" />;
      case "Repeat":
        return <RefreshCw className="size-3" />;
      case "New":
        return <User className="size-3" />;
      case "Potential":
        return <Users className="size-3" />;
      default:
        return <User className="size-3" />;
    }
  };

  return (
    <Badge variant={getVariant(displayGroup)} className="gap-1">
      {getIcon(displayGroup)}
      {displayGroup}
    </Badge>
  );
}

