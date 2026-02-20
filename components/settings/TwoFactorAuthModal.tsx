"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Shield, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "enable" | "disable";
  onSuccess?: () => void;
}

export default function TwoFactorAuthModal({
  isOpen,
  onClose,
  mode = "enable",
  onSuccess,
}: TwoFactorAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"setup" | "verify" | "complete">("setup");
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCode, setCopiedBackupCode] = useState<number | null>(null);

  // Real data from backend
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable flow state
  const [disablePassword, setDisablePassword] = useState("");
  const [disableBackupCode, setDisableBackupCode] = useState("");

  // Fetch 2FA setup data when modal opens (enable mode only)
  useEffect(() => {
    if (isOpen && mode === "enable" && currentStep === "setup" && !secret) {
      const fetch2FAData = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post("/api/user/2fa/enable");
          setQrCodeUrl(response.data.qrCodeUrl);
          setSecret(response.data.secret);
          setBackupCodes(response.data.backupCodes);
        } catch (error: any) {
          toast.error(
            error.response?.data?.message || "Failed to initialize 2FA setup"
          );
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      fetch2FAData();
    }
  }, [isOpen, mode, currentStep, secret, onClose]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success("Secret key copied to clipboard!");
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedBackupCode(index);
    toast.success("Backup code copied!");
    setTimeout(() => setCopiedBackupCode(null), 2000);
  };

  const handleCopyAllBackupCodes = () => {
    const allCodes = backupCodes.join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success("All backup codes copied!");
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/user/2fa/verify", {
        code: verificationCode,
        secret: secret,
        backupCodes: backupCodes,
      });
      
      setCurrentStep("complete");
      toast.success("Two-factor authentication enabled!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Invalid verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    setVerificationCode("");
    setCurrentStep("setup");
    setSecret("");
    setQrCodeUrl("");
    setBackupCodes([]);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    setVerificationCode("");
    setCurrentStep("setup");
    setSecret("");
    setQrCodeUrl("");
    setBackupCodes([]);
    setDisablePassword("");
    setDisableBackupCode("");
    onClose();
  };

  const handleDisable = async () => {
    if (!disablePassword && !disableBackupCode) {
      toast.error("Please enter your password or a backup code");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/user/2fa/disable", {
        password: disablePassword || undefined,
        backupCode: disableBackupCode || undefined,
      });

      toast.success("Two-factor authentication disabled");
      setDisablePassword("");
      setDisableBackupCode("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to disable two-factor authentication"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>
              {mode === "disable" ? "Disable" : "Enable"} Two-Factor Authentication
            </DialogTitle>
          </div>
          <DialogDescription>
            {mode === "disable"
              ? "Confirm your identity to disable two-factor authentication"
              : "Add an extra layer of security to your account"}
          </DialogDescription>
        </DialogHeader>

        {mode === "disable" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Disabling 2FA will remove the extra layer of security from your account. You will only need your password to sign in.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disable-password">Password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  placeholder="Enter your password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disable-backup-code">Backup Code</Label>
                <Input
                  id="disable-backup-code"
                  placeholder="Enter a backup code"
                  value={disableBackupCode}
                  onChange={(e) => setDisableBackupCode(e.target.value)}
                  disabled={isLoading}
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={(!disablePassword && !disableBackupCode) || isLoading}
              >
                {isLoading ? "Disabling..." : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === "enable" && currentStep === "setup" && (
          <div className="space-y-6">
            <Tabs defaultValue="app" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="app">Authenticator App</TabsTrigger>
                <TabsTrigger value="info">How It Works</TabsTrigger>
              </TabsList>

              <TabsContent value="app" className="space-y-4 mt-4">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Step 1: Download an authenticator app</h4>
                    <p className="text-sm text-muted-foreground">
                      Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your phone.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Step 2: Scan the QR code</h4>
                    <p className="text-sm text-muted-foreground">
                      Open your authenticator app and scan this QR code:
                    </p>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      {qrCodeUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- QR code is a data URL
                        <img
                          src={qrCodeUrl}
                          alt="QR Code"
                          className="w-48 h-48"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                          Loading QR code...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Can&apos;t scan? Enter manually</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        value={secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopySecret}
                      >
                        {copiedSecret ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Step 3: Enter verification code</Label>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app to verify setup:
                  </p>
                  <Input
                    id="verificationCode"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
              </TabsContent>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Smartphone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Enhanced Security</h4>
                      <p className="text-sm text-muted-foreground">
                        Two-factor authentication (2FA) adds an extra layer of protection beyond just your password. Even if someone knows your password, they won&apos;t be able to access your account without the code from your phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">How It Works</h4>
                      <p className="text-sm text-muted-foreground">
                        After entering your password, you&apos;ll be asked for a 6-digit code that changes every 30 seconds. This code is generated by an authenticator app on your phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm mb-1">Backup Codes</h4>
                      <p className="text-sm text-muted-foreground">
                        You&apos;ll receive backup codes that can be used if you lose access to your phone. Store them somewhere safe!
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : "Enable 2FA"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === "enable" && currentStep === "complete" && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-lg">2FA Enabled Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your account is now protected with two-factor authentication.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-sm text-amber-900 dark:text-amber-100">
                    Save Your Backup Codes
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Store these codes somewhere safe. You can use them to access your account if you lose your phone.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Backup Codes</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAllBackupCodes}
                    className="h-7 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 p-3 bg-background rounded-md border">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent transition-colors group"
                    >
                      <code className="text-sm font-mono">{code}</code>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyBackupCode(code, index)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedBackupCode === index ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

