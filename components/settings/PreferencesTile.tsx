"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

export default function PreferencesTile() {
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get("/api/user/preferences");
        setEmailNotificationsEnabled(response.data.emailNotificationsEnabled);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch preferences"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Handle toggle change
  const handleToggleChange = async (checked: boolean) => {
    // Optimistic update
    const previousValue = emailNotificationsEnabled;
    setEmailNotificationsEnabled(checked);
    setIsUpdating(true);

    try {
      await axios.patch("/api/user/preferences", {
        emailNotificationsEnabled: checked,
      });
      
      toast.success(
        checked
          ? "Email notifications enabled"
          : "Email notifications disabled"
      );
    } catch (error: any) {
      // Rollback on error
      setEmailNotificationsEnabled(previousValue);
      toast.error(
        error.response?.data?.message || "Failed to update preferences"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Preferences</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Manage your notification preferences
      </p>

      <div className="space-y-4">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <Label
              htmlFor="email-notifications"
              className="font-semibold cursor-pointer"
            >
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Receive email notifications about campaigns, orders, and updates
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotificationsEnabled}
            onCheckedChange={handleToggleChange}
            disabled={isLoading || isUpdating}
            className="ml-4"
          />
        </div>
      </div>
    </div>
  );
}
