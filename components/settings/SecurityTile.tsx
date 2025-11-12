"use client";

import { useState } from "react";
import ResetPasswordModal from "./ResetPasswordModal";
import TwoFactorAuthModal from "./TwoFactorAuthModal";

export default function SecurityTile() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

  return (
    <>
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-bold">Security</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage your account security settings
        </p>

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
                  Add an extra layer of security to your account
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
        </div>
      </div>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorAuthModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
      />
    </>
  );
}

