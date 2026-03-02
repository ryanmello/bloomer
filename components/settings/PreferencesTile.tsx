"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import TwoFactorAuthModal from "./TwoFactorAuthModal";

interface PreferencesTileProps {
  twoFactorEnabled: boolean;
  onTwoFactorChange: () => void;
}

export default function PreferencesTile({ twoFactorEnabled, onTwoFactorChange }: PreferencesTileProps) {
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  const fetchPreferences = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggleChange = async (checked: boolean) => {
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
      setEmailNotificationsEnabled(previousValue);
      toast.error(
        error.response?.data?.message || "Failed to update preferences"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTwoFactorToggle = () => {
    setShowTwoFactorModal(true);
  };

  const handleTwoFactorModalClose = () => {
    setShowTwoFactorModal(false);
    onTwoFactorChange();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your notification and security preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
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

          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex-1">
              <Label
                htmlFor="two-factor-auth"
                className="font-semibold cursor-pointer"
              >
                Two-Factor Authentication
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Require a verification code in addition to your password when signing in
              </p>
            </div>
            <Switch
              id="two-factor-auth"
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
              disabled={isLoading}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      <TwoFactorAuthModal
        isOpen={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        mode={twoFactorEnabled ? "disable" : "enable"}
        onSuccess={handleTwoFactorModalClose}
      />
    </>
  );
}
