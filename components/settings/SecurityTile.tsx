"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import ResetPasswordModal from "./ResetPasswordModal";
import TwoFactorAuthModal from "./TwoFactorAuthModal";

interface SecurityTileProps {
  twoFactorEnabled: boolean;
  onTwoFactorChange: () => void;
}

export default function SecurityTile({ twoFactorEnabled, onTwoFactorChange }: SecurityTileProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          {/* Reset Password Option */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <h3 className="font-semibold">Reset Password</h3>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
            </div>
            <svg
              className="h-5 w-5 text-muted-foreground group-hover:text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Two-Factor Authentication Option */}
          <button
            onClick={() => setShowTwoFactorModal(true)}
            className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="text-left">
                <h3 className="font-semibold">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? "Manage your two-factor authentication"
                    : "Add an extra layer of security to your account"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  twoFactorEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
              <svg
                className="h-5 w-5 text-muted-foreground group-hover:text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>
        </CardContent>
      </Card>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorAuthModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        mode={twoFactorEnabled ? "disable" : "enable"}
        onSuccess={onTwoFactorChange}
      />
    </>
  );
}
