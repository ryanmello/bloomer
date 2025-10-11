import React from 'react';
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Package, CheckCircle2 } from "lucide-react";

interface DeliveryCardProps {
  id: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  orderDetails: string;
  deliveryTime: string;
  status: "pending" | "completed";
  onClick?: () => void;
}

export default function DeliveryCard({
  customerName,
  address,
  phoneNumber,
  orderDetails,
  deliveryTime,
  status,
  onClick,
}: DeliveryCardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-sm p-4 bg-card border-border min-w-0 w-full cursor-pointer transition-all hover:shadow-md ${
        status === "completed" ? "opacity-60" : ""
      }`}
      onClick={onClick}
    >
      {/* Header with Name and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-foreground mb-1 truncate">
            {customerName}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{deliveryTime}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {status === "completed" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <Badge
            variant="default"
            className={`${
              status === "pending"
                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700"
                : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700"
            } shadow-none`}
          >
            {status === "pending" ? "Pending" : "Completed"}
          </Badge>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="space-y-3 pt-3 border-t border-border">
        {/* Address */}
        <div className="flex items-start gap-2">
          <div className="rounded-md p-1.5 bg-muted">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Address
            </div>
            <div className="text-sm text-foreground leading-snug">
              {address}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="flex items-start gap-2">
          <div className="rounded-md p-1.5 bg-muted">
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Order
            </div>
            <div className="text-sm text-foreground leading-snug">
              {orderDetails}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1.5 bg-muted">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground mb-0.5">
              Phone
            </div>
            <div className="text-sm text-foreground">
              {phoneNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
